import { Signal } from './rtcCrypto';

export class SignalingError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}
export async function rtcRequest<T>(
  path: string,
  token: string,
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (signal?.aborted) throw new DOMException('已取消', 'AbortError');
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(cancel, 10000);
    try {
      const response = await fetch(`/api/rtc/${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      const value = await response.json().catch(() => null);
      if (!response.ok || !value?.result)
        throw new SignalingError(
          value?.msg ||
            (response.status === 401
              ? '请先登录再发送文件'
              : '信令服务暂不可用'),
          response.status
        );
      return value.data as T;
    } catch (error) {
      if (
        signal?.aborted ||
        (error instanceof SignalingError && error.status < 500) ||
        attempt === 2
      )
        throw error;
      await delay(500 * (attempt + 1), signal);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
    }
  }
  throw new Error('信令请求失败');
}
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted)
      return reject(new DOMException('已取消', 'AbortError'));
    const cleanup = () => signal?.removeEventListener('abort', abort);
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const abort = () => {
      clearTimeout(timer);
      cleanup();
      reject(new DOMException('已取消', 'AbortError'));
    };
    signal?.addEventListener('abort', abort, { once: true });
  });
}
export interface RtcEvent {
  seq: number;
  role: 'sender' | 'receiver';
  payload: string;
}
export const getSignals = (
  room: string,
  token: string,
  after: number,
  signal: AbortSignal
) =>
  rtcRequest<{ events: RtcEvent[] }>(
    `rooms/${room}/events?after=${after}`,
    token,
    undefined,
    signal
  );
export const sendSignal = (
  room: string,
  token: string,
  data: Signal,
  signal: AbortSignal
) => rtcRequest(`rooms/${room}/events`, token, { signal: data }, signal);
export const getIceServers = (
  room: string,
  token: string,
  signal: AbortSignal
) =>
  rtcRequest<{ iceServers: RTCIceServer[] }>(
    `rooms/${room}/ice-config`,
    token,
    {},
    signal
  );
