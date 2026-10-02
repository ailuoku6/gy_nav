import { describe, expect, it } from 'vitest';
import {
  createFileContext,
  decryptChunk,
  encryptChunk,
  generatePairingCode,
  normalizeCode,
  openFileContext,
} from './rtcCrypto';

describe('rtc crypto protocol', () => {
  it('round trips a chunk and envelope with the pairing code', async () => {
    const code = generatePairingCode();
    const context = await createFileContext(code, {
      name: 'hello.txt',
      size: 5,
      type: 'text/plain',
    });
    const reopened = await openFileContext(code, context.envelope);
    const cipher = await encryptChunk(
      context,
      0,
      new TextEncoder().encode('hello').buffer
    );
    const plain = await decryptChunk(reopened, 0, cipher);
    expect(new TextDecoder().decode(plain)).toBe('hello');
    expect(reopened.manifest.name).toBe('hello.txt');
  });

  it('rejects a wrong pairing code and tampered ciphertext', async () => {
    const context = await createFileContext('0123456789ABCDEFGHJKMNPQRS', {
      name: 'x.bin',
      size: 1,
      type: 'application/octet-stream',
    });
    await expect(
      openFileContext('123456789ABCDEFGHJKMNPQRT', context.envelope)
    ).rejects.toThrow();
    const cipher = new Uint8Array(
      await encryptChunk(context, 0, new Uint8Array([1]).buffer)
    );
    cipher[0] ^= 1;
    await expect(decryptChunk(context, 0, cipher.buffer)).rejects.toThrow();
  });

  it('rejects malformed pairing codes', () => {
    expect(() => normalizeCode('short')).toThrow();
    expect(() => normalizeCode('0000000000000000000000000I-')).toThrow();
  });
});
