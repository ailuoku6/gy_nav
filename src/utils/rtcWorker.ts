import { FileContext } from './rtcCrypto';

export class CryptoWorker {
  private worker = new Worker(
    new URL('../workers/rtc-transfer.worker.ts', import.meta.url),
    { type: 'module' }
  );
  private next = 0;
  private disposed = false;
  private pending = new Map<
    number,
    { resolve(value: ArrayBuffer): void; reject(reason: Error): void }
  >();
  constructor() {
    this.worker.onmessage = (
      event: MessageEvent<{ id: number; result: ArrayBuffer; error?: string }>
    ) => {
      const entry = this.pending.get(event.data.id);
      if (!entry) return;
      this.pending.delete(event.data.id);
      if (event.data.error) entry.reject(new Error(event.data.error));
      else entry.resolve(event.data.result);
    };
    this.worker.onerror = () => this.dispose();
  }
  run(
    operation: 'encrypt' | 'decrypt',
    context: FileContext,
    index: number,
    data: ArrayBuffer
  ) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      if (this.disposed) return reject(new Error('传输已停止'));
      const id = ++this.next;
      this.pending.set(id, { resolve, reject });
      try {
        this.worker.postMessage({ id, operation, context, index, data }, [
          data,
        ]);
      } catch (error) {
        this.pending.delete(id);
        reject(error);
      }
    });
  }
  dispose() {
    this.disposed = true;
    this.worker.terminate();
    for (const task of this.pending.values())
      task.reject(new Error('传输已停止'));
    this.pending.clear();
  }
}
