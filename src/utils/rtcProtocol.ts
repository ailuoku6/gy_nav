import { chunkLength, decodeFrame, FileContext } from './rtcCrypto';

/** One bounded chunk at a time; no partial bytes survive a new connection. */
export class ChunkAssembler {
  private cipher?: Uint8Array;
  private offset = 0;
  constructor(
    private context: FileContext,
    public nextChunk = 0
  ) {}

  push(data: ArrayBuffer): ArrayBuffer | undefined {
    const frame = decodeFrame(data);
    const expected = chunkLength(this.context.manifest, this.nextChunk) + 16;
    if (
      frame.index !== this.nextChunk ||
      frame.total !== expected ||
      frame.offset !== this.offset
    ) {
      throw new Error('分块顺序或偏移无效，已停止接收');
    }
    this.cipher ??= new Uint8Array(expected);
    this.cipher.set(frame.payload, this.offset);
    this.offset += frame.payload.length;
    if (this.offset !== expected) return;
    const result = this.cipher.buffer;
    this.cipher = undefined;
    this.offset = 0;
    return result;
  }

  commit() {
    this.nextChunk += 1;
  }
  reset() {
    this.cipher = undefined;
    this.offset = 0;
  }
}

export interface ControlMessage {
  type:
    | 'hello'
    | 'ready'
    | 'ack'
    | 'complete'
    | 'saved'
    | 'cancel'
    | 'error'
    | 'pake-init'
    | 'pake-share'
    | 'pake-confirm';
  envelope?: FileContext['envelope'];
  nextChunk?: number;
  index?: number;
  sid?: string;
  share?: string;
  role?: 'sender' | 'receiver';
  confirmation?: string;
}
export function parseControl(data: string): ControlMessage {
  if (data.length > 32768) throw new Error('控制消息过大');
  const value = JSON.parse(data) as ControlMessage;
  if (
    !value ||
    ![
      'hello',
      'ready',
      'ack',
      'complete',
      'saved',
      'cancel',
      'error',
      'pake-init',
      'pake-share',
      'pake-confirm',
    ].includes(value.type)
  )
    throw new Error('控制消息无效');
  return value;
}
export function resumeIndex(value: unknown, chunks: number) {
  if (
    !Number.isSafeInteger(value) ||
    typeof value !== 'number' ||
    value < 0 ||
    value > chunks
  )
    throw new Error('续传位置无效');
  return value;
}
