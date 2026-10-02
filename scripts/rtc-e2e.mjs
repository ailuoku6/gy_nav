// Run against `wrangler pages dev build --port 8789 --binding TokenSecret=rtc-local-e2e`.
// This test creates local-only JWTs and uses the real D1, signaling, WebRTC and crypto workers.
import { createHmac, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const { chromium } = await import(
  process.env.RTC_PLAYWRIGHT_MODULE || 'playwright'
);
const origin = process.env.RTC_E2E_URL || 'http://127.0.0.1:8789';
assert.ok(
  ['localhost', '127.0.0.1'].includes(new URL(origin).hostname),
  'This script is for local databases only'
);
const encode = (value) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');
const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ user: { id: 987654 }, exp: Math.floor(Date.now() / 1000) + 3600 })}`;
const token = `${unsigned}.${createHmac('sha256', 'rtc-local-e2e').update(unsigned).digest('base64url')}`;
const browser = await chromium.launch({
  headless: true,
  channel: process.env.RTC_BROWSER_CHANNEL || 'chrome',
});
const hash = (data) => createHash('sha256').update(data).digest('hex');
const errors = [];

async function pages({
  disconnect = false,
  pickerCancel = false,
  lostSaved = false,
  tamper = false,
} = {}) {
  const senderContext = await browser.newContext();
  const receiverContext = await browser.newContext({ acceptDownloads: true });
  await senderContext.addInitScript((token) => {
    localStorage.setItem('token', token);
    const NativePeer = window.RTCPeerConnection;
    window.__rtcPeers = [];
    window.RTCPeerConnection = class extends NativePeer {
      constructor(...args) {
        super(...args);
        window.__rtcPeers.push(this);
      }
    };
  }, token);
  if (tamper)
    await senderContext.addInitScript(() => {
      const send = RTCDataChannel.prototype.send;
      let changed = false;
      RTCDataChannel.prototype.send = function (data) {
        if (data instanceof ArrayBuffer && !changed) {
          new Uint8Array(data)[12] ^= 1;
          changed = true;
        }
        return send.call(this, data);
      };
    });
  const sender = await senderContext.newPage();
  if (process.env.RTC_E2E_HOST_ONLY === '1') {
    for (const context of [senderContext, receiverContext])
      await context.route('**/api/rtc/rooms/*/ice-config', (route) =>
        route.fulfill({ json: { result: true, data: { iceServers: [] } } })
      );
  }
  await receiverContext.addInitScript(
    ({ disconnect, pickerCancel, lostSaved }) => {
      window.showSaveFilePicker = undefined; // Exercise the bounded Blob fallback.
      if (pickerCancel)
        window.showSaveFilePicker = async () => {
          throw new DOMException('cancelled', 'AbortError');
        };
      if (disconnect || lostSaved) {
        const send = RTCDataChannel.prototype.send;
        let dropped = false;
        RTCDataChannel.prototype.send = function (data) {
          if (
            typeof data === 'string' &&
            !dropped &&
            JSON.parse(data).type === (lostSaved ? 'saved' : 'ack')
          ) {
            dropped = true;
            // The first block is saved but its ACK is lost. Resume must not duplicate it.
            void window.__rtcDisconnect();
            return;
          }
          return send.call(this, data);
        };
      }
    },
    { disconnect, pickerCancel, lostSaved }
  );
  if (disconnect || lostSaved)
    await receiverContext.exposeBinding('__rtcDisconnect', async () => {
      await sender.evaluate(() => window.__rtcPeers.at(-1).close());
    });
  const receiver = await receiverContext.newPage();
  for (const page of [sender, receiver])
    page.on('pageerror', (error) => errors.push(error.message));
  await Promise.all([
    sender.goto(`${origin}/transfer`),
    receiver.goto(`${origin}/transfer`),
  ]);
  await receiver.getByRole('tab', { name: '接收', exact: true }).click();
  return {
    sender,
    receiver,
    close: async () => {
      await senderContext.close();
      await receiverContext.close();
    },
  };
}
async function connect(pair, bytes) {
  await pair.sender.locator('input[type=file]').setInputFiles({
    name: 'rtc-test.bin',
    mimeType: 'application/octet-stream',
    buffer: bytes,
  });
  await pair.sender.getByRole('button', { name: '生成配对码并发送' }).click();
  const code = pair.sender.getByTestId('pairing-code');
  await code.waitFor({ timeout: 30000 });
  await pair.receiver.getByLabel('配对码').fill(await code.textContent());
  await pair.receiver
    .getByRole('button', { name: '加入会话', exact: true })
    .click();
}

try {
  for (const size of process.env.RTC_E2E_SIZE
    ? [Number(process.env.RTC_E2E_SIZE)]
    : [0, 1024, 1024 * 1024, 1024 * 1024 + 1, 4 * 1024 * 1024 + 1]) {
    const disconnect = size > 2 * 1024 * 1024;
    const pair = await pages({ disconnect });
    try {
      const bytes = Buffer.alloc(size);
      for (let i = 0; i < size; i++) bytes[i] = i % 251;
      await connect(pair, bytes);
      await pair.receiver
        .getByRole('button', { name: '确认接收文件' })
        .click({ timeout: 150000 });
      await pair.receiver
        .getByRole('link', { name: '下载文件' })
        .waitFor({ timeout: 90000 });
      const downloadPromise = pair.receiver.waitForEvent('download');
      await pair.receiver.getByRole('link', { name: '下载文件' }).click();
      const download = await downloadPromise;
      const received = await readFile(await download.path());
      assert.equal(received.length, bytes.length);
      assert.equal(hash(received), hash(bytes));
      await pair.sender
        .getByText('发送完成，接收方已确认接收全部数据', { exact: true })
        .waitFor({ timeout: 15000 });
      if (disconnect)
        assert.ok(
          await pair.sender.evaluate(() => window.__rtcPeers.length >= 2),
          'The connection should be rebuilt'
        );
      console.log(
        `PASS ${size} bytes${disconnect ? ' including lost ACK + reconnect' : ''}`
      );
    } catch (error) {
      console.error(
        'Sender:',
        await pair.sender.locator('[role=alert]').allTextContents()
      );
      console.error(
        'Receiver:',
        await pair.receiver.locator('[role=alert]').allTextContents()
      );
      console.error('Browser errors:', errors);
      console.error(
        'Peer states:',
        await pair.sender.evaluate(() =>
          window.__rtcPeers.map((pc) => ({
            connection: pc.connectionState,
            gathering: pc.iceGatheringState,
            hasLocal: !!pc.localDescription,
            hasRemote: !!pc.remoteDescription,
          }))
        )
      );
      throw error;
    } finally {
      await pair.close();
    }
  }
  const finalPair = await pages({ lostSaved: true });
  try {
    await connect(finalPair, Buffer.from('lost final save confirmation'));
    await finalPair.receiver
      .getByRole('button', { name: '确认接收文件' })
      .click({ timeout: 150000 });
    await finalPair.sender
      .getByText('发送完成，接收方已确认接收全部数据', { exact: true })
      .waitFor({ timeout: 150000 });
    assert.ok(
      await finalPair.sender.evaluate(() => window.__rtcPeers.length >= 2)
    );
    console.log('PASS reconnect after lost save confirmation');
  } finally {
    await finalPair.close();
  }
  const tamperPair = await pages({ tamper: true });
  try {
    await connect(tamperPair, Buffer.from('authenticated ciphertext'));
    await tamperPair.receiver
      .getByRole('button', { name: '确认接收文件' })
      .click({ timeout: 150000 });
    await tamperPair.receiver
      .getByText('文件加密校验失败，已停止传输', { exact: true })
      .waitFor();
    assert.equal(
      await tamperPair.receiver.getByRole('link', { name: '下载文件' }).count(),
      0
    );
    await tamperPair.sender
      .getByText('接收方已取消或拒绝传输', { exact: true })
      .waitFor();
    console.log('PASS ciphertext tamper rejection');
  } finally {
    await tamperPair.close();
  }
  const pickerPair = await pages({ pickerCancel: true });
  try {
    await connect(pickerPair, Buffer.from('picker cancellation'));
    await pickerPair.receiver
      .getByRole('button', { name: '选择保存位置并接收' })
      .click({ timeout: 150000 });
    await pickerPair.receiver
      .getByText('已取消选择保存位置，可再次点击接收', { exact: true })
      .waitFor();
    assert.equal(
      await pickerPair.receiver.getByRole('link', { name: '下载文件' }).count(),
      0
    );
    await pickerPair.receiver.getByRole('button', { name: '取消传输' }).click();
    await pickerPair.sender
      .getByText('接收方已取消或拒绝传输', { exact: true })
      .waitFor({ timeout: 15000 });
    console.log('PASS picker cancellation and peer cancellation');
  } finally {
    await pickerPair.close();
  }
  const badPair = await pages();
  try {
    await badPair.receiver.getByLabel('配对码').fill('0'.repeat(26));
    await badPair.receiver
      .getByRole('button', { name: '加入会话', exact: true })
      .click();
    await badPair.receiver
      .getByText('配对码无效、已被领取或已过期', { exact: true })
      .waitFor();
    console.log('PASS invalid pairing code');
  } finally {
    await badPair.close();
  }
  assert.deepEqual(errors, [], 'Unexpected browser errors');
} finally {
  await browser.close();
}
