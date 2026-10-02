import { decryptChunk, encryptChunk, FileContext } from '../utils/rtcCrypto';

interface Task {
  id: number;
  operation: 'encrypt' | 'decrypt';
  context: FileContext;
  index: number;
  data: ArrayBuffer;
}
const worker = self as unknown as {
  onmessage: ((event: MessageEvent<Task>) => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
};
worker.onmessage = (event) => {
  const { id, operation, context, index, data } = event.data;
  void (async () => {
    try {
      const result = await (operation === 'encrypt'
        ? encryptChunk(context, index, data)
        : decryptChunk(context, index, data));
      worker.postMessage({ id, result }, [result]);
    } catch {
      worker.postMessage({ id, error: '文件加密校验失败，已停止传输' });
    }
  })();
};
