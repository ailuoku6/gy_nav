import { describe, expect, it } from 'vitest';
import { ChunkAssembler, parseControl, resumeIndex } from './rtcProtocol';
import {
  CHUNK_SIZE,
  createFileContext,
  decryptChunk,
  encodeFrame,
  encryptChunk,
  FRAME_SIZE,
  generatePairingCode,
  signSignal,
  verifySignal,
} from './rtcCrypto';

async function fixture(size: number) {
  const context = await createFileContext(generatePairingCode(), {
    name: 'sample.bin',
    size,
    type: '',
  });
  const bytes = Uint8Array.from(
    { length: Math.min(size, CHUNK_SIZE) },
    (_, i) => i % 251
  );
  return {
    context,
    bytes,
    cipher: new Uint8Array(await encryptChunk(context, 0, bytes.buffer)),
  };
}

describe('WebRTC frame assembly and resume', () => {
  it.each([0, 1024, CHUNK_SIZE, CHUNK_SIZE + 1])(
    'reassembles authenticated chunks for file size %i',
    async (size) => {
      const { context, bytes, cipher } = await fixture(size);
      const assembler = new ChunkAssembler(context);
      let result: ArrayBuffer | undefined;
      for (let offset = 0; offset < cipher.length; offset += FRAME_SIZE - 12) {
        result = assembler.push(
          encodeFrame(
            0,
            offset,
            cipher.length,
            cipher.subarray(offset, offset + FRAME_SIZE - 12)
          )
        );
      }
      expect(new Uint8Array(await decryptChunk(context, 0, result!))).toEqual(
        bytes
      );
      assembler.commit();
      expect(assembler.nextChunk).toBe(1);
    }
  );

  it('rejects gaps, overlapping frames, wrong chunk ids and inflated totals', async () => {
    const { context, cipher } = await fixture(1024);
    const assembler = new ChunkAssembler(context);
    expect(() =>
      assembler.push(encodeFrame(0, 1, cipher.length, cipher.subarray(0, 1)))
    ).toThrow();
    expect(() =>
      assembler.push(encodeFrame(1, 0, cipher.length, cipher))
    ).toThrow();
    expect(() =>
      assembler.push(encodeFrame(0, 0, cipher.length + 1, cipher))
    ).toThrow();
    assembler.push(encodeFrame(0, 0, cipher.length, cipher.subarray(0, 10)));
    expect(() =>
      assembler.push(encodeFrame(0, 0, cipher.length, cipher.subarray(0, 10)))
    ).toThrow();
  });

  it('discards partial chunks on reconnect while retaining committed progress', async () => {
    const { context, cipher } = await fixture(CHUNK_SIZE + 1);
    const assembler = new ChunkAssembler(context);
    assembler.push(encodeFrame(0, 0, cipher.length, cipher.subarray(0, 10)));
    assembler.reset();
    let result: ArrayBuffer | undefined;
    for (let offset = 0; offset < cipher.length; offset += FRAME_SIZE - 12) {
      result = assembler.push(
        encodeFrame(
          0,
          offset,
          cipher.length,
          cipher.subarray(offset, offset + FRAME_SIZE - 12)
        )
      );
    }
    expect(result?.byteLength).toBe(CHUNK_SIZE + 16);
    assembler.commit();
    assembler.reset();
    expect(assembler.nextChunk).toBe(1);
  });

  it('bounds resume positions and rejects malformed control messages', () => {
    expect(resumeIndex(2, 2)).toBe(2);
    for (const value of [-1, 3, 1.5, '1', undefined])
      expect(() => resumeIndex(value, 2)).toThrow();
    for (const value of ['null', '{}', '{"type":"unknown"}', 'x'.repeat(32769)])
      expect(() => parseControl(value)).toThrow();
  });

  it('authenticates SDP, generation and peer roles', async () => {
    const code = generatePairingCode();
    const roomId = 'a'.repeat(64);
    const signal = await signSignal(code, {
      version: 1,
      roomId,
      generation: 1,
      role: 'sender',
      type: 'offer',
      nonce: crypto.randomUUID(),
      sdp: 'test-sdp',
    });
    await expect(verifySignal(code, signal, roomId)).resolves.toBeUndefined();
    await expect(
      verifySignal(code, { ...signal, generation: 2 }, roomId)
    ).rejects.toThrow();
    await expect(
      verifySignal(code, { ...signal, sdp: 'replaced' }, roomId)
    ).rejects.toThrow();
    await expect(
      verifySignal(code, { ...signal, role: 'receiver' }, roomId)
    ).rejects.toThrow();
  });
});
