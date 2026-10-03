import { ControlMessage, parseControl } from './rtcProtocol';
import { delay } from './rtcSignalingApi';

export class ControlInbox {
  private queue: ControlMessage[] = [];
  private waiters = new Map<string, (value: ControlMessage) => void>();
  push(data: string) {
    const value = parseControl(data);
    const waiter = this.waiters.get(value.type);
    if (waiter) {
      this.waiters.delete(value.type);
      waiter(value);
    } else this.queue.push(value);
  }
  async take(
    type: ControlMessage['type'],
    signal: AbortSignal,
    timeoutMs = 15000
  ) {
    const index = this.queue.findIndex((value) => value.type === type);
    if (index >= 0) return this.queue.splice(index, 1)[0];
    if (this.waiters.has(type)) throw new Error('重复等待控制消息');
    let resolveValue!: (value: ControlMessage) => void;
    const valuePromise = new Promise<ControlMessage>((resolve) => {
      resolveValue = resolve;
    });
    this.waiters.set(type, resolveValue);
    const start = Date.now();
    try {
      while (!signal.aborted && Date.now() - start < timeoutMs) {
        const result = await Promise.race([
          valuePromise,
          delay(50, signal).then(() => undefined),
        ]);
        if (result) return result;
      }
      if (signal.aborted) throw signal.reason;
      throw new Error('配对验证超时');
    } finally {
      this.waiters.delete(type);
    }
  }
}

export function sendControl(channel: RTCDataChannel, message: ControlMessage) {
  if (channel.readyState !== 'open') throw new Error('连接已断开');
  channel.send(JSON.stringify(message));
}
