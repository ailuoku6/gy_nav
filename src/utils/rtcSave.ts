import { Manifest } from './rtcCrypto';

export interface SaveResult {
  url?: string;
  name: string;
  streamed: boolean;
}
export interface FileSink {
  write(data: Uint8Array): Promise<void>;
  finish(): Promise<SaveResult>;
  abort(): Promise<void>;
}
interface WritableFile {
  write(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
}
interface PickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName: string;
  }) => Promise<{ createWritable(): Promise<WritableFile> }>;
}
export const canStreamSave = () =>
  typeof (window as unknown as PickerWindow).showSaveFilePicker === 'function';
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

/** Called directly by the receive button so the picker retains user activation. */
export async function createSink(manifest: Manifest): Promise<FileSink> {
  const name = safeName(manifest.name);
  let written = 0;
  let ended = false;
  let writable: WritableFile | undefined;
  let parts: Uint8Array[] = [];
  const picker = (window as unknown as PickerWindow).showSaveFilePicker;
  if (picker) {
    const handle = await picker.call(window, { suggestedName: name });
    writable = await handle.createWritable();
  } else if (manifest.size > blobLimit()) {
    throw new Error(
      `当前浏览器最多接收 ${blobLimit() / 1024 / 1024} MiB，请使用桌面 Chrome/Edge 接收更大的文件`
    );
  }
  return {
    async write(data) {
      if (ended || written + data.length > manifest.size)
        throw new Error('保存数据大小无效');
      if (writable) await writable.write(data);
      else parts.push(data);
      written += data.length;
    },
    async finish() {
      if (ended || written !== manifest.size)
        throw new Error('文件不完整，已停止保存');
      if (writable) {
        await writable.close();
        ended = true;
        return { name, streamed: true };
      }
      const blob = new Blob(parts, { type: 'application/octet-stream' });
      parts = [];
      ended = true;
      return { name, streamed: false, url: URL.createObjectURL(blob) };
    },
    async abort() {
      if (ended) return;
      ended = true;
      parts = [];
      if (writable) await writable.abort();
    },
  };
}
