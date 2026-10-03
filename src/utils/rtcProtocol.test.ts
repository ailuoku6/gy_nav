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
  roomIdForCode,
  sealFileEnvelope,
  openFileContext,
  validateSignal,
} from './rtcCrypto';
import { createPakeEphemeral, derivePakeSessionKey } from './rtcPake';

async function fixture(size: number) {
  const code = generatePairingCode();
  const roomId = await roomIdForCode(code);
  const sid = crypto.getRandomValues(new Uint8Array(32));
  const sender = await createPakeEphemeral(code, sid, roomId, 'sender');
  const receiver = await createPakeEphemeral(code, sid, roomId, 'receiver');
  const senderKey = derivePakeSessionKey(sender, receiver.share);
  const receiverKey = derivePakeSessionKey(receiver, sender.share);
  const context = await createFileContext({
    name: 'sample.bin',
    size,
    type: '',
  });
  const reopened = await openFileContext(
    receiverKey,
    await sealFileEnvelope(context, senderKey)
  );
  const bytes = Uint8Array.from(
    { length: Math.min(size, CHUNK_SIZE) },
    (_, i) => i % 251
  );
  return {
    context: reopened,
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
      for (let offset = 0; offset < cipher.length; offset += FRAME_SIZE - 12)
        result = assembler.push(
          encodeFrame(
            0,
            offset,
            cipher.length,
            cipher.subarray(offset, offset + FRAME_SIZE - 12)
          )
        );
      expect(new Uint8Array(await decryptChunk(context, 0, result!))).toEqual(
        bytes
      );
      assembler.commit();
      expect(assembler.nextChunk).toBe(1);
    }
  );
  it('rejects gaps, overlaps and invalid chunk lengths', async () => {
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
  });
  it('discards partial chunks on reconnect while retaining committed progress', async () => {
    const { context, cipher } = await fixture(CHUNK_SIZE + 1);
    const assembler = new ChunkAssembler(context);
    assembler.push(encodeFrame(0, 0, cipher.length, cipher.subarray(0, 10)));
    assembler.reset();
    let result: ArrayBuffer | undefined;
    for (let offset = 0; offset < cipher.length; offset += FRAME_SIZE - 12)
      result = assembler.push(
        encodeFrame(
          0,
          offset,
          cipher.length,
          cipher.subarray(offset, offset + FRAME_SIZE - 12)
        )
      );
    expect(result?.byteLength).toBe(CHUNK_SIZE + 16);
    assembler.commit();
    assembler.reset();
    expect(assembler.nextChunk).toBe(1);
  });
  it('bounds resume positions and rejects malformed controls', () => {
    expect(resumeIndex(2, 2)).toBe(2);
    for (const value of [-1, 3, 1.5, '1', undefined])
      expect(() => resumeIndex(value, 2)).toThrow();
    for (const value of ['null', '{}', '{"type":"unknown"}', 'x'.repeat(32769)])
      expect(() => parseControl(value)).toThrow();
  });
  it('validates trickle ICE messages', () => {
    const signal = {
      version: 2 as const,
      roomId: 'a'.repeat(64),
      generation: 1,
      nonce: crypto.randomUUID(),
      role: 'sender' as const,
      type: 'candidate' as const,
      sdp: '',
      candidate: { candidate: 'candidate:1', sdpMid: '0', sdpMLineIndex: 0 },
    };
    expect(() => validateSignal(signal, signal.roomId)).not.toThrow();
    expect(() =>
      validateSignal(
        { ...signal, candidate: { candidate: 'x'.repeat(4097) } },
        signal.roomId
      )
    ).toThrow();
  });
});
