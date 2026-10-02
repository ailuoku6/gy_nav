import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSink, safeName } from './rtcSave';
import { Manifest } from './rtcCrypto';

const manifest = { name: '../sample.bin', size: 3 } as Manifest;
afterEach(() => vi.unstubAllGlobals());

describe('file save lifecycle', () => {
  it('does not silently download after cancelling the save picker', async () => {
    vi.stubGlobal('window', {
      showSaveFilePicker: () =>
        Promise.reject(new DOMException('cancelled', 'AbortError')),
    });
    await expect(createSink(manifest)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
  it('writes a stream and verifies exact length before closing', async () => {
    const writable = { write: vi.fn(), close: vi.fn(), abort: vi.fn() };
    vi.stubGlobal('window', {
      showSaveFilePicker: async () => ({
        createWritable: async () => writable,
      }),
    });
    const sink = await createSink(manifest);
    await sink.write(new Uint8Array([1, 2]));
    await expect(sink.finish()).rejects.toThrow('不完整');
    await sink.write(new Uint8Array([3]));
    expect(await sink.finish()).toMatchObject({ streamed: true });
    await sink.abort();
    expect(writable.close).toHaveBeenCalledOnce();
    expect(writable.abort).not.toHaveBeenCalled();
    await expect(sink.write(new Uint8Array([4]))).rejects.toThrow();
  });
  it('aborts an unfinished stream once and rejects oversized writes', async () => {
    const writable = { write: vi.fn(), close: vi.fn(), abort: vi.fn() };
    vi.stubGlobal('window', {
      showSaveFilePicker: async () => ({
        createWritable: async () => writable,
      }),
    });
    const sink = await createSink(manifest);
    await expect(sink.write(new Uint8Array(4))).rejects.toThrow();
    await sink.abort();
    await sink.abort();
    expect(writable.abort).toHaveBeenCalledOnce();
  });
  it('limits memory fallback on mobile', async () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('navigator', { userAgent: 'iPhone' });
    await expect(
      createSink({ ...manifest, size: 33 * 1024 * 1024 })
    ).rejects.toThrow('最多接收');
    expect(safeName('../a\\b\u0000.txt')).toBe('_a_b_.txt');
  });
});
