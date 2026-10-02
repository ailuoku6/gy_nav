import {
  CHUNK_SIZE,
  FRAME_SIZE,
  createFileContext,
  displayPairingCode,
  encodeFrame,
  FileContext,
  generatePairingCode,
  Manifest,
  normalizeCode,
  openFileContext,
  randomToken,
  readApplicationToken,
  receiverProof,
  roomIdForCode,
  sha256,
  Signal,
  signSignal,
  verifySignal,
} from './rtcCrypto';
import {
  ChunkAssembler,
  ControlMessage,
  parseControl,
  resumeIndex,
} from './rtcProtocol';
import { createSink, FileSink, SaveResult } from './rtcSave';
import {
  delay,
  getIceServers,
  getSignals,
  rtcRequest,
  sendSignal,
  SignalingError,
} from './rtcSignalingApi';
import { CryptoWorker } from './rtcWorker';

interface Room {
  roomId: string;
  token: string;
  code: string;
}
export interface TransferCallbacks {
  status(value: string): void;
  progress(value: number): void;
  code?(value: string): void;
  file?(value: Manifest): void;
  complete(result?: SaveResult): void;
  error(message: string): void;
}
class ConnectionLost extends Error {}
class ProtocolError extends Error {}
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : '文件传输失败';
const cancellation = () => new DOMException('已取消传输', 'AbortError');
const fatal = (error: unknown) =>
  error instanceof ProtocolError ||
  (error instanceof SignalingError && error.status < 500);

function checkedSend(channel: RTCDataChannel, data: string | ArrayBuffer) {
  if (channel.readyState !== 'open') throw new ConnectionLost('连接已断开');
  if (typeof data === 'string') channel.send(data);
  else channel.send(data);
}
function control(channel: RTCDataChannel, message: ControlMessage) {
  checkedSend(channel, JSON.stringify(message));
}
function waitUntil(
  check: () => boolean,
  signal: AbortSignal,
  timeout: number,
  message: string
) {
  const start = Date.now();
  return (async () => {
    while (!check()) {
      if (signal.aborted) throw signal.reason;
      if (Date.now() - start > timeout) throw new ConnectionLost(message);
      await delay(40, signal);
    }
    if (signal.aborted) throw signal.reason;
  })();
}
function watchPeer(pc: RTCPeerConnection, lifetime: AbortSignal) {
  const attempt = new AbortController();
  const abort = () => attempt.abort(lifetime.reason);
  lifetime.addEventListener('abort', abort, { once: true });
  let disconnected: ReturnType<typeof setTimeout> | undefined;
  pc.onconnectionstatechange = () => {
    clearTimeout(disconnected);
    if (pc.connectionState === 'failed' || pc.connectionState === 'closed')
      attempt.abort(new ConnectionLost('连接已断开'));
    if (pc.connectionState === 'disconnected')
      disconnected = setTimeout(
        () => attempt.abort(new ConnectionLost('网络已断开')),
        5000
      );
  };
  attempt.signal.addEventListener(
    'abort',
    () => {
      clearTimeout(disconnected);
      lifetime.removeEventListener('abort', abort);
    },
    { once: true }
  );
  if (lifetime.aborted) abort();
  return attempt;
}
async function gather(pc: RTCPeerConnection, signal: AbortSignal) {
  await waitUntil(
    () => pc.iceGatheringState === 'complete',
    signal,
    60000,
    '网络候选收集超时'
  );
}

/** Keeps all capabilities, file keys and resume state in this page's memory. */
export class RtcTransfer {
  private lifetime = new AbortController();
  private room?: Room;
  private pc?: RTCPeerConnection;
  private channel?: RTCDataChannel;
  private attempt?: AbortController;
  private worker?: CryptoWorker;
  private context?: FileContext;
  private sink?: FileSink;
  private assembler?: ChunkAssembler;
  private receiveQueue: Promise<void> = Promise.resolve();
  private saved?: SaveResult;
  private accepting = false;
  private helloChannel?: RTCDataChannel;
  private completed = false;
  private generation = 0;
  private terminalTimer?: ReturnType<typeof setTimeout>;

  constructor(private callbacks: TransferCallbacks) {}
  get stopped() {
    return this.lifetime.signal.aborted;
  }
  private ensureActive() {
    if (this.stopped) throw this.lifetime.signal.reason;
  }
  private notifyStatus(value: string) {
    if (!this.stopped) this.callbacks.status(value);
  }

  private async makeRoom(code: string, sender: boolean) {
    const room = {
      code,
      roomId: await roomIdForCode(code),
      token: randomToken(),
    };
    this.ensureActive();
    const proof = await receiverProof(code);
    // Keep the capability before POST, so cancellation can clean up a lost response.
    this.room = room;
    await rtcRequest(
      sender ? 'rooms' : 'rooms/join',
      sender ? readApplicationToken() : room.token,
      sender
        ? {
            roomId: room.roomId,
            tokenHash: await sha256(room.token),
            verifier: await sha256(proof),
          }
        : { roomId: room.roomId, tokenHash: await sha256(room.token), proof },
      this.lifetime.signal
    );
    this.ensureActive();
    this.worker = new CryptoWorker();
    void this.heartbeat().catch((error) => this.fail(error));
    return room;
  }

  private async heartbeat() {
    while (!this.stopped && this.room) {
      await delay(30000, this.lifetime.signal);
      await rtcRequest(
        `rooms/${this.room.roomId}/heartbeat`,
        this.room.token,
        {},
        this.lifetime.signal
      );
    }
  }

  private resetPeer() {
    this.attempt?.abort(new ConnectionLost('正在重新连接'));
    if (this.channel) {
      this.channel.onclose = null;
      this.channel.onmessage = null;
      this.channel.close();
    }
    if (this.pc) {
      this.pc.onconnectionstatechange = null;
      this.pc.ondatachannel = null;
      this.pc.close();
    }
    this.channel = undefined;
    this.helloChannel = undefined;
    this.pc = undefined;
  }

  private newPeer(iceServers: RTCIceServer[]) {
    this.ensureActive();
    this.resetPeer();
    const pc = new RTCPeerConnection({ iceServers });
    this.pc = pc;
    this.attempt = watchPeer(pc, this.lifetime.signal);
    return pc;
  }

  private bindChannel(channel: RTCDataChannel, attempt: AbortController) {
    channel.binaryType = 'arraybuffer';
    channel.bufferedAmountLowThreshold = 256 * 1024;
    this.channel = channel;
    channel.onclose = () => attempt.abort(new ConnectionLost('数据通道已断开'));
    channel.onerror = () =>
      attempt.abort(new ConnectionLost('数据通道发生错误'));
  }

  private async publish(
    pc: RTCPeerConnection,
    generation: number,
    role: 'sender' | 'receiver',
    signal: AbortSignal
  ) {
    const room = this.room!;
    await gather(pc, signal);
    const value = await signSignal(room.code, {
      version: 1,
      roomId: room.roomId,
      generation,
      role,
      type: role === 'sender' ? 'offer' : 'answer',
      nonce: crypto.randomUUID(),
      sdp: pc.localDescription?.sdp || '',
    });
    await sendSignal(room.roomId, room.token, value, signal);
  }

  private async poll(
    onSignal: (value: Signal) => Promise<void>,
    signal: AbortSignal
  ) {
    let after = 0;
    let failures = 0;
    while (!signal.aborted) {
      try {
        const room = this.room!;
        const result = await getSignals(room.roomId, room.token, after, signal);
        for (const event of result.events) {
          const value = JSON.parse(event.payload) as Signal;
          try {
            await verifySignal(room.code, value, room.roomId);
          } catch {
            throw new ProtocolError('信令认证失败，已停止传输');
          }
          await onSignal(value);
          after = Math.max(after, event.seq);
        }
        failures = 0;
      } catch (error) {
        if (signal.aborted) throw signal.reason;
        if (fatal(error) || ++failures >= 5) throw error;
      }
      await delay(1500, signal);
    }
  }

  async send(file: File) {
    try {
      if (!window.isSecureContext || !window.RTCPeerConnection)
        throw new Error('请使用支持 WebRTC 的浏览器，通过 HTTPS 打开此页面');
      // Validate the file and login before occupying a room.
      readApplicationToken();
      const code = generatePairingCode();
      this.context = await createFileContext(code, file);
      this.ensureActive();
      const room = await this.makeRoom(code, true);
      this.callbacks.code?.(displayPairingCode(code));
      this.notifyStatus('配对码已生成，等待接收方连接（10 分钟内有效）…');
      const ice = await getIceServers(
        room.roomId,
        room.token,
        this.lifetime.signal
      );
      for (let generation = 1; generation <= 8; generation++) {
        this.ensureActive();
        try {
          await this.sendAttempt(file, ice.iceServers, generation);
          this.ensureActive();
          this.completed = true;
          this.callbacks.progress(100);
          this.callbacks.complete();
          this.stop();
          return;
        } catch (error) {
          if (this.stopped || fatal(error)) throw error;
          this.resetPeer();
          if (generation === 8)
            throw new Error('重连次数已用完，请重新生成配对码');
          this.notifyStatus(
            `连接中断，正在第 ${generation} 次重连；接收方保留已保存的部分…`
          );
          await delay(1000 * Math.min(generation, 3), this.lifetime.signal);
        }
      }
    } catch (error) {
      this.fail(error);
    }
  }

  private async sendAttempt(
    file: File,
    iceServers: RTCIceServer[],
    generation: number
  ) {
    const pc = this.newPeer(iceServers);
    const attempt = this.attempt!;
    const channel = pc.createDataChannel('file', { ordered: true });
    this.bindChannel(channel, attempt);
    const signal = attempt.signal;
    const context = this.context!;
    let expected: 'ready' | 'ack' | 'saved' | undefined;
    let result: ControlMessage | undefined;
    let ackIndex = -1;
    channel.onmessage = (event) => {
      try {
        if (typeof event.data !== 'string')
          throw new ProtocolError('收到无效响应');
        const message = parseControl(event.data);
        if (message.type === 'cancel' || message.type === 'error')
          throw new ProtocolError('接收方已取消或拒绝传输');
        if (
          message.type !== expected ||
          (message.type === 'ack' && message.index !== ackIndex)
        )
          throw new ProtocolError('确认消息不匹配');
        result = message;
      } catch (error) {
        attempt.abort(
          error instanceof ProtocolError
            ? error
            : new ProtocolError(errorText(error))
        );
      }
    };
    const response = async (
      type: 'ready' | 'ack' | 'saved',
      send: () => Promise<void> | void,
      timeout = 60000
    ) => {
      expected = type;
      result = undefined;
      await send();
      await waitUntil(
        () => result !== undefined,
        signal,
        timeout,
        '等待对端确认超时'
      );
      expected = undefined;
      return result!;
    };
    try {
      const polling = this.poll(async (value) => {
        if (
          value.role === 'receiver' &&
          value.generation === generation &&
          !pc.remoteDescription
        ) {
          await pc.setRemoteDescription({ type: 'answer', sdp: value.sdp });
        }
      }, signal).catch((error) => {
        if (!signal.aborted) attempt.abort(error);
      });
      await pc.setLocalDescription(await pc.createOffer());
      await this.publish(pc, generation, 'sender', signal);
      await waitUntil(
        () => channel.readyState === 'open',
        signal,
        generation === 1 ? 600000 : 90000,
        '连接超时：请确认双方在线；当前网络可能需要 TURN'
      );
      const ready = await response(
        'ready',
        () => control(channel, { type: 'hello', envelope: context.envelope }),
        600000
      );
      const next = resumeIndex(ready.nextChunk, context.manifest.chunks);
      this.callbacks.progress(
        Math.floor((next / context.manifest.chunks) * 100)
      );
      this.notifyStatus('已建立加密连接，正在发送…');
      for (let index = next; index < context.manifest.chunks; index++) {
        ackIndex = index;
        await response('ack', async () => {
          const plain = await file
            .slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)
            .arrayBuffer();
          const cipher = new Uint8Array(
            await this.worker!.run('encrypt', context, index, plain)
          );
          for (
            let offset = 0;
            offset < cipher.length;
            offset += FRAME_SIZE - 12
          ) {
            await waitUntil(
              () => channel.bufferedAmount < 1024 * 1024,
              signal,
              30000,
              '发送缓冲区超时'
            );
            checkedSend(
              channel,
              encodeFrame(
                index,
                offset,
                cipher.length,
                cipher.subarray(offset, offset + FRAME_SIZE - 12)
              )
            );
          }
        });
        this.callbacks.progress(
          Math.min(
            99,
            Math.floor(((index + 1) / context.manifest.chunks) * 100)
          )
        );
      }
      this.notifyStatus('数据已发送，等待接收方保存完成…');
      await response('saved', () => control(channel, { type: 'complete' }));
      attempt.abort();
      await polling;
    } catch (error) {
      if (signal.aborted && !this.stopped) throw signal.reason;
      throw error instanceof ConnectionLost || error instanceof SignalingError
        ? error
        : new ProtocolError(errorText(error));
    } finally {
      attempt.abort();
    }
  }

  async receive(pairingCode: string) {
    try {
      if (!window.isSecureContext || !window.RTCPeerConnection)
        throw new Error('请使用支持 WebRTC 的浏览器，通过 HTTPS 打开此页面');
      const room = await this.makeRoom(normalizeCode(pairingCode), false);
      const ice = await getIceServers(
        room.roomId,
        room.token,
        this.lifetime.signal
      );
      this.notifyStatus('已加入，等待发送方建立加密连接…');
      this.terminalTimer = setTimeout(
        () => this.fail(new Error('会话已超过两小时，请重新配对')),
        7200000
      );
      await this.poll(async (value) => {
        if (value.role !== 'sender' || value.generation <= this.generation)
          return;
        this.generation = value.generation;
        await this.receiveOffer(value, ice.iceServers);
      }, this.lifetime.signal);
    } catch (error) {
      if (this.completed) this.stop(false);
      else this.fail(error);
    }
  }

  private async receiveOffer(value: Signal, iceServers: RTCIceServer[]) {
    const pc = this.newPeer(iceServers);
    const attempt = this.attempt!;
    // Serialize new hello behind any old write, including an ACK lost on disconnect.
    pc.ondatachannel = (event) => {
      const channel = event.channel;
      if (
        channel.label !== 'file' ||
        channel.ordered !== true ||
        this.channel
      ) {
        this.fail(new ProtocolError('数据通道无效'));
        return;
      }
      this.bindChannel(channel, attempt);
      channel.onmessage = (message) => {
        this.receiveQueue = this.receiveQueue
          .then(async () => {
            if (this.stopped || channel !== this.channel) return;
            await this.receiveMessage(channel, message.data);
          })
          .catch((error) => {
            if (error instanceof ConnectionLost || attempt.signal.aborted)
              return;
            this.fail(new ProtocolError(errorText(error)));
          });
      };
      attempt.signal.addEventListener(
        'abort',
        () => {
          if (!this.completed && !this.stopped && this.channel === channel)
            this.notifyStatus('连接中断，等待发送方重连，已保存的部分会保留…');
        },
        { once: true }
      );
    };
    try {
      await pc.setRemoteDescription({ type: 'offer', sdp: value.sdp });
      await pc.setLocalDescription(await pc.createAnswer());
      await this.publish(pc, value.generation, 'receiver', attempt.signal);
    } catch (error) {
      if (!attempt.signal.aborted || fatal(error)) throw error;
    }
  }

  private async receiveMessage(
    channel: RTCDataChannel,
    data: string | ArrayBuffer
  ) {
    if (typeof data === 'string') {
      const message = parseControl(data);
      if (message.type === 'cancel' || message.type === 'error')
        throw new ProtocolError('发送方已取消传输');
      if (message.type === 'hello') {
        const context = await openFileContext(
          this.room!.code,
          message.envelope!
        );
        if (
          this.context &&
          JSON.stringify(this.context.envelope) !==
            JSON.stringify(context.envelope)
        )
          throw new ProtocolError('续传文件身份不匹配');
        this.helloChannel = channel;
        this.context ??= context;
        this.assembler ??= new ChunkAssembler(context);
        this.assembler.reset();
        if (this.sink || this.saved)
          control(channel, {
            type: 'ready',
            nextChunk: this.assembler.nextChunk,
          });
        else {
          this.callbacks.file?.(context.manifest);
          this.notifyStatus('请确认文件信息并选择保存位置');
        }
        return;
      }
      if (message.type === 'complete') {
        if (
          !this.context ||
          !this.sink ||
          this.assembler?.nextChunk !== this.context.manifest.chunks
        )
          throw new ProtocolError('文件不完整');
        if (!this.saved) {
          this.saved = await this.sink.finish();
          this.completed = true;
          this.callbacks.progress(100);
          this.callbacks.complete(this.saved);
          clearTimeout(this.terminalTimer);
          this.terminalTimer = setTimeout(() => this.stop(false), 120000);
        }
        control(channel, { type: 'saved' });
        return;
      }
      throw new ProtocolError('收到无效控制消息');
    }
    if (
      !(data instanceof ArrayBuffer) ||
      !this.context ||
      !this.sink ||
      this.saved ||
      !this.assembler
    )
      throw new ProtocolError('文件数据到达时尚未准备接收');
    const cipher = this.assembler.push(data);
    if (!cipher) return;
    const index = this.assembler.nextChunk;
    const plain = await this.worker!.run(
      'decrypt',
      this.context,
      index,
      cipher
    );
    this.ensureActive();
    await this.sink.write(new Uint8Array(plain));
    this.assembler.commit();
    this.callbacks.progress(
      Math.min(
        99,
        Math.floor(
          (this.assembler.nextChunk / this.context.manifest.chunks) * 100
        )
      )
    );
    control(channel, { type: 'ack', index });
  }

  /** Invoked synchronously from the user's click, before any network/crypto await. */
  async accept() {
    if (!this.context || this.stopped || this.sink || this.accepting)
      return !!this.sink;
    this.accepting = true;
    try {
      const sink = await createSink(this.context.manifest);
      if (this.stopped) {
        await sink.abort();
        return;
      }
      this.sink = sink;
      if (
        this.channel?.readyState === 'open' &&
        this.helloChannel === this.channel
      )
        control(this.channel, {
          type: 'ready',
          nextChunk: this.assembler!.nextChunk,
        });
      this.notifyStatus(`正在接收：${this.context.manifest.name}`);
      return true;
    } catch (error) {
      // Cancelling the picker never silently falls back to downloading into memory.
      if (error instanceof DOMException && error.name === 'AbortError')
        this.notifyStatus('已取消选择保存位置，可再次点击接收');
      else this.fail(error);
    } finally {
      this.accepting = false;
    }
  }

  cancel() {
    if (this.channel?.readyState === 'open') {
      try {
        control(this.channel, { type: 'cancel' });
      } catch {
        /* Closing still cancels the session. */
      }
    }
    this.stop();
  }

  private fail(error: unknown) {
    if (this.stopped) return;
    if (this.completed) {
      this.stop(false);
      return;
    }
    if (this.channel?.readyState === 'open') {
      try {
        control(this.channel, { type: 'error' });
      } catch {
        /* Cleanup follows. */
      }
    }
    this.callbacks.error(errorText(error));
    this.stop();
  }

  private stop(closeRoom = true) {
    if (this.stopped) return;
    this.lifetime.abort(cancellation());
    clearTimeout(this.terminalTimer);
    this.resetPeer();
    this.worker?.dispose();
    void this.receiveQueue
      .then(() => this.sink?.abort())
      .catch(() => undefined);
    if (closeRoom && this.room) {
      // Best effort on unload; room leases also bound abandoned sessions.
      void fetch(`/api/rtc/rooms/${this.room.roomId}/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.room.token}` },
        keepalive: true,
      }).catch(() => undefined);
    }
  }
}
