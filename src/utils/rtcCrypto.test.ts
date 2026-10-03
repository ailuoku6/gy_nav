import { describe, expect, it } from 'vitest';
import {
  createFileContext,
  decryptChunk,
  encryptChunk,
  generatePairingCode,
  normalizeCode,
  openFileContext,
  sealFileEnvelope,
} from './rtcCrypto';
import {
  createPakeConfirmation,
  createPakeEphemeral,
  derivePakeSessionKey,
  verifyPakeConfirmation,
} from './rtcPake';

describe('short-code CPace file envelope', () => {
  it('uses six unbiased base36 symbols', () => {
    for (let i = 0; i < 500; i++)
      expect(generatePairingCode()).toMatch(/^[0-9A-Z]{6}$/);
    expect(normalizeCode(' a1-b2 c3 ')).toBe('A1B2C3');
    expect(() => normalizeCode('abcde')).toThrow();
    expect(() => normalizeCode('abcde*')).toThrow();
  });

  it('derives a shared session key and confirms both peers', async () => {
    const code = generatePairingCode();
    const room = await (await import('./rtcCrypto')).roomIdForCode(code);
    const sid = crypto.getRandomValues(new Uint8Array(32));
    const sender = await createPakeEphemeral(code, sid, room, 'sender');
    const receiver = await createPakeEphemeral(code, sid, room, 'receiver');
    const a = derivePakeSessionKey(sender, receiver.share);
    const b = derivePakeSessionKey(receiver, sender.share);
    expect(a).toEqual(b);
    const confirmation = await createPakeConfirmation(a, 'sender');
    await expect(
      verifyPakeConfirmation(b, 'sender', confirmation)
    ).resolves.toBeUndefined();
    await expect(
      verifyPakeConfirmation(b, 'receiver', confirmation)
    ).rejects.toThrow();
  });

  it('rejects a wrong code during online key confirmation without an offline verifier', async () => {
    const room = 'a'.repeat(64);
    const sid = crypto.getRandomValues(new Uint8Array(32));
    const sender = await createPakeEphemeral('A1B2C3', sid, room, 'sender');
    const receiver = await createPakeEphemeral('A1B2C4', sid, room, 'receiver');
    const a = derivePakeSessionKey(sender, receiver.share);
    const b = derivePakeSessionKey(receiver, sender.share);
    const confirmation = await createPakeConfirmation(a, 'sender');
    await expect(
      verifyPakeConfirmation(b, 'sender', confirmation)
    ).rejects.toThrow();
  });

  it('round trips a random file key envelope and rejects tampering', async () => {
    const code = generatePairingCode();
    const room = await (await import('./rtcCrypto')).roomIdForCode(code);
    const sid = crypto.getRandomValues(new Uint8Array(32));
    const sender = await createPakeEphemeral(code, sid, room, 'sender');
    const receiver = await createPakeEphemeral(code, sid, room, 'receiver');
    const a = derivePakeSessionKey(sender, receiver.share);
    const b = derivePakeSessionKey(receiver, sender.share);
    const context = await createFileContext({
      name: 'hello.txt',
      size: 5,
      type: 'text/plain',
    });
    const envelope = await sealFileEnvelope(context, a);
    const reopened = await openFileContext(b, envelope);
    const cipher = await encryptChunk(
      context,
      0,
      new TextEncoder().encode('hello').buffer
    );
    expect(
      new TextDecoder().decode(await decryptChunk(reopened, 0, cipher))
    ).toBe('hello');
    await expect(
      openFileContext(new Uint8Array(64), envelope)
    ).rejects.toThrow();
    const damaged = {
      ...envelope,
      ciphertext:
        (envelope.ciphertext[0] === 'A' ? 'B' : 'A') +
        envelope.ciphertext.slice(1),
    };
    await expect(openFileContext(b, damaged)).rejects.toThrow();
  });
});
