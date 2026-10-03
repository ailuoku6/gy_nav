import { Manifest } from './rtcCrypto';

export interface SaveResult {
  url: string;
  name: string;
  size: number;
  streamed: boolean;
  source?: { getFile(): Promise<Blob>; remove(): Promise<void> };
}
export interface FileSink {
  write(data: Uint8Array): Promise<void>;
  finish(): Promise<SaveResult>;
  abort(): Promise<void>;
}
interface WritableFile {
  write(data: BufferSource): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
}
interface SaveFileHandle {
  createWritable(): Promise<WritableFile>;
}
interface OpfsFileHandle extends SaveFileHandle {
  getFile(): Promise<Blob>;
}
interface OpfsDirectoryHandle {
  getFileHandle(
    name: string,
    options: { create: boolean }
  ): Promise<OpfsFileHandle>;
  removeEntry(name: string): Promise<void>;
}
type GetDirectoryStorage = {
  getDirectory?: () => Promise<OpfsDirectoryHandle>;
};
interface PickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName: string;
  }) => Promise<SaveFileHandle>;
}
export const canChooseSaveLocation = () =>
  typeof (window as unknown as PickerWindow).showSaveFilePicker === 'function';
export const supportsOpfs = () =>
  typeof navigator !== 'undefined' &&
  !!navigator.storage &&
  typeof (navigator.storage as unknown as GetDirectoryStorage).getDirectory ===
    'function';
export const blobLimit = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    ? 32 * 1024 * 1024
    : 100 * 1024 * 1024;
export const safeName = (name: string) =>
  Array.from(name, (char) =>
    char.charCodeAt(0) < 32 ||
    char.charCodeAt(0) === 127 ||
    '/\\:*?"<>|'.includes(char)
      ? '_'
      : char
  )
    .join('')
    .replace(/^[. ]+|[. ]+$/g, '')
    .slice(0, 240) || 'download';

/** Stage plaintext in OPFS when available; ask where to save only after transfer. */
export async function createSink(
  manifest: Manifest,
  options: { deferPicker?: boolean } = {}
): Promise<FileSink> {
  const name = safeName(manifest.name);
  let written = 0;
  let ended = false;
  let writable: WritableFile | undefined;
  let opfsFile: OpfsFileHandle | undefined;
  let opfsRemove: (() => Promise<void>) | undefined;
  let parts: Uint8Array[] = [];
  const picker = (window as unknown as PickerWindow).showSaveFilePicker;

  if (options.deferPicker) {
    const getDirectory =
      typeof navigator !== 'undefined' && navigator.storage
        ? (navigator.storage as unknown as GetDirectoryStorage).getDirectory
        : undefined;
    if (getDirectory) {
      const estimate = await navigator.storage.estimate();
      const available = (estimate.quota ?? Infinity) - (estimate.usage ?? 0);
      if (available < manifest.size)
        throw new Error('设备可用空间不足，无法接收此文件');
      const directory = await getDirectory.call(navigator.storage);
      const opfsName = `.rtc-transfer-${crypto.randomUUID()}`;
      opfsFile = await directory.getFileHandle(opfsName, { create: true });
      opfsRemove = () => directory.removeEntry(opfsName);
      writable = await opfsFile.createWritable();
    } else if (manifest.size > blobLimit()) {
      throw new Error(
        `当前浏览器不支持大文件暂存，最多接收 ${blobLimit() / 1024 / 1024} MiB`
      );
    }
  } else if (picker) {
    const handle = await picker.call(window, { suggestedName: name });
    writable = await handle.createWritable();
  } else if (manifest.size > blobLimit()) {
    throw new Error(
      `当前浏览器最多接收 ${blobLimit() / 1024 / 1024} MiB，请使用支持大文件暂存的浏览器`
    );
  }

  return {
    async write(data) {
      if (ended || written + data.length > manifest.size)
        throw new Error('保存数据大小无效');
      if (writable) await writable.write(data);
      else parts.push(data.slice());
      written += data.length;
    },
    async finish() {
      if (ended || written !== manifest.size)
        throw new Error('文件不完整，已停止保存');
      if (writable) await writable.close();
      const blob = opfsFile
        ? await opfsFile.getFile()
        : new Blob(parts, { type: 'application/octet-stream' });
      parts = [];
      ended = true;
      return {
        name,
        size: manifest.size,
        streamed: !!opfsFile,
        url: URL.createObjectURL(blob),
        source: opfsFile
          ? {
              getFile: () => opfsFile!.getFile(),
              remove: () => opfsRemove!(),
            }
          : undefined,
      };
    },
    async abort() {
      if (ended) return;
      ended = true;
      parts = [];
      if (writable) await writable.abort();
      if (opfsRemove) await opfsRemove();
    },
  };
}

/** Must be called directly from a user click to retain picker activation. */
export async function saveResultToPicker(result: SaveResult) {
  const picker = (window as unknown as PickerWindow).showSaveFilePicker;
  if (!picker) return false;
  const handle = await picker.call(window, { suggestedName: result.name });
  const writable = await handle.createWritable();
  try {
    const file = result.source
      ? await result.source.getFile()
      : await (await fetch(result.url)).blob();
    const reader = file.stream().getReader();
    let done = false;
    while (!done) {
      const next = await reader.read();
      done = next.done;
      if (!done && next.value) await writable.write(next.value);
    }
    await writable.close();
    return true;
  } catch (error) {
    await writable.abort();
    throw error;
  }
}
export async function disposeSaveResult(result: SaveResult) {
  URL.revokeObjectURL(result.url);
  await result.source?.remove();
}
