export const CHUNK_SIZE = 1024 * 1024;
export const FRAME_SIZE = 16 * 1024;
export const MAX_FILE_SIZE = 1024 * 1024 * 1024;
const encoder = new TextEncoder();
export const PAIRING_CODE_LENGTH = 6;
// 36 进制短码用于用户输入；真正的文件密钥仍由每个文件随机生成。
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const toHex = (value: ArrayBuffer) =>
  Array.from(new Uint8Array(value), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');

export const normalizeCode = (value: string) => {
  const code = value.toUpperCase().replace(/[\s-]/g, '');
  if (!/^[0-9A-Z]{6}$/.test(code)) throw new Error('请输入完整的 6 位配对码');
  return code;
};
export const generatePairingCode = () => {
  const result: string[] = [];
  const random = new Uint8Array(32);
  while (result.length < PAIRING_CODE_LENGTH) {
    crypto.getRandomValues(random);
    for (const byte of random) {
      if (byte >= 252) continue; // 7 * 36; avoids modulo bias.
      result.push(alphabet[byte % 36]);
      if (result.length === PAIRING_CODE_LENGTH) break;
    }
  }
  return result.join('');
};
export const displayPairingCode = (value: string) => normalizeCode(value);
export const roomIdForCode = async (value: string) =>
  toHex(
    await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(`gy-rtc/v1/room:${normalizeCode(value)}`)
    )
  );
export const randomToken = () =>
  toHex(crypto.getRandomValues(new Uint8Array(32)).buffer);
export const sha256 = async (value: string) =>
  toHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
export function readApplicationToken() {
  const value = window.localStorage.getItem('token');
  if (!value) throw new Error('请先登录再发送文件');
  try {
    const token: unknown = JSON.parse(value);
    if (typeof token === 'string') return token;
  } catch {
    /* Older versions stored unquoted tokens. */
  }
  return value;
}
export const base64 = (value: ArrayBuffer | Uint8Array) => {
  let binary = '';
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};
export const unbase64 = (value: string, length?: number) => {
  if (
    typeof value !== 'string' ||
    value.length > 32768 ||
    !/^[\w-]*$/.test(value)
  )
    throw new Error('加密字段无效');
  const bytes = Uint8Array.from(
    atob(value.replace(/-/g, '+').replace(/_/g, '/')),
    (char) => char.charCodeAt(0)
  );
  if (length !== undefined && bytes.length !== length)
    throw new Error('加密字段长度无效');
  return bytes;
};

export type Signal = {
  version: 2;
  roomId: string;
  generation: number;
  nonce: string;
  role: 'sender' | 'receiver';
  type: 'offer' | 'answer' | 'candidate';
  sdp: string;
  candidate?: RTCIceCandidateInit;
};
export function validateSignal(signal: Signal, roomId: string) {
  if (
    signal.version !== 2 ||
    signal.roomId !== roomId ||
    !Number.isSafeInteger(signal.generation) ||
    signal.generation < 1 ||
    signal.generation > 8 ||
    !['sender', 'receiver'].includes(signal.role) ||
    !['offer', 'answer', 'candidate'].includes(signal.type) ||
    (signal.type === 'offer' && signal.role !== 'sender') ||
    (signal.type === 'answer' && signal.role !== 'receiver') ||
    typeof signal.sdp !== 'string' ||
    signal.sdp.length > 48000 ||
    !/^[a-f0-9-]{36}$/.test(signal.nonce) ||
    (signal.type === 'candidate' &&
      (!signal.candidate ||
        typeof signal.candidate.candidate !== 'string' ||
        signal.candidate.candidate.length > 4096 ||
        signal.sdp !== '')) ||
    (signal.type !== 'candidate' && !signal.sdp)
  )
    throw new Error('信令数据无效');
}

export interface Manifest {
  version: 1;
  transferId: string;
  name: string;
  mime: string;
  size: number;
  chunks: number;
  chunkSize: number;
  noncePrefix: string;
}
export interface Envelope {
  version: 2;
  transferId: string;
  iv: string;
  ciphertext: string;
}
export interface FileContext {
  key: CryptoKey;
  keyFingerprint: string;
  manifest: Manifest;
  envelope: Envelope;
}

function validateManifest(manifest: Manifest) {
  if (
    manifest.version !== 1 ||
    !/^[a-f0-9-]{36}$/.test(manifest.transferId) ||
    typeof manifest.name !== 'string' ||
    !manifest.name ||
    manifest.name.length > 255 ||
    typeof manifest.mime !== 'string' ||
    manifest.mime.length > 255 ||
    !Number.isSafeInteger(manifest.size) ||
    manifest.size < 0 ||
    manifest.size > MAX_FILE_SIZE ||
    manifest.chunkSize !== CHUNK_SIZE ||
    manifest.chunks !== Math.max(1, Math.ceil(manifest.size / CHUNK_SIZE))
  )
    throw new Error('文件信息无效');
  if (unbase64(manifest.noncePrefix).length !== 8)
    throw new Error('文件 nonce 无效');
}

export async function createFileContext(
  file: Pick<File, 'name' | 'size' | 'type'>
): Promise<FileContext> {
  const transferId = crypto.randomUUID();
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', true, [
    'encrypt',
    'decrypt',
  ]);
  const manifest: Manifest = {
    version: 1,
    transferId,
    name: file.name,
    mime: file.type,
    size: file.size,
    chunks: Math.max(1, Math.ceil(file.size / CHUNK_SIZE)),
    chunkSize: CHUNK_SIZE,
    noncePrefix: base64(crypto.getRandomValues(new Uint8Array(8))),
  };
  validateManifest(manifest);
  const keyFingerprint = toHex(await crypto.subtle.digest('SHA-256', rawKey));
  rawKey.fill(0);
  const context: FileContext = {
    key,
    keyFingerprint,
    manifest,
    envelope: { version: 2, transferId, iv: '', ciphertext: '' },
  };
  return context;
}

async function envelopeKey(isk: Uint8Array) {
  const material = await crypto.subtle.importKey('raw', isk, 'HKDF', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32),
      info: encoder.encode('gy-nav/webrtc/v2/file-envelope'),
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
export async function sealFileEnvelope(context: FileContext, isk: Uint8Array) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aad = encoder.encode(
    `gy-nav/webrtc/v2/envelope/${context.manifest.transferId}`
  );
  const key = await envelopeKey(isk);
  const rawFileKey = new Uint8Array(
    await crypto.subtle.exportKey('raw', context.key)
  );
  const payload = encoder.encode(
    JSON.stringify({ manifest: context.manifest, fileKey: base64(rawFileKey) })
  );
  rawFileKey.fill(0);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad },
    key,
    payload
  );
  return {
    version: 2 as const,
    transferId: context.manifest.transferId,
    iv: base64(iv),
    ciphertext: base64(ciphertext),
  };
}
export async function openFileContext(
  isk: Uint8Array,
  envelope: Envelope
): Promise<FileContext> {
  if (envelope.version !== 2 || !/^[a-f0-9-]{36}$/.test(envelope.transferId))
    throw new Error('文件协议无效');
  const key = await envelopeKey(isk);
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: unbase64(envelope.iv, 12),
      additionalData: encoder.encode(
        `gy-nav/webrtc/v2/envelope/${envelope.transferId}`
      ),
    },
    key,
    unbase64(envelope.ciphertext)
  );
  const payload = JSON.parse(new TextDecoder().decode(plaintext)) as {
    manifest: Manifest;
    fileKey: string;
  };
  validateManifest(payload.manifest);
  if (payload.manifest.transferId !== envelope.transferId)
    throw new Error('文件会话不匹配');
  const rawFileKey = unbase64(payload.fileKey, 32);
  const fileKey = await crypto.subtle.importKey(
    'raw',
    rawFileKey,
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );
  const keyFingerprint = toHex(
    await crypto.subtle.digest('SHA-256', rawFileKey)
  );
  rawFileKey.fill(0);
  return { key: fileKey, keyFingerprint, manifest: payload.manifest, envelope };
}

export const chunkLength = (manifest: Manifest, index: number) => {
  if (!Number.isInteger(index) || index < 0 || index >= manifest.chunks)
    throw new Error('分块序号无效');
  return Math.min(CHUNK_SIZE, Math.max(0, manifest.size - index * CHUNK_SIZE));
};
function chunkAlgorithm(manifest: Manifest, index: number) {
  const iv = new Uint8Array(12);
  iv.set(unbase64(manifest.noncePrefix));
  new DataView(iv.buffer).setUint32(8, index);
  return {
    name: 'AES-GCM',
    iv,
    additionalData: encoder.encode(
      JSON.stringify([
        'gy-rtc/v1/chunk',
        manifest.transferId,
        index,
        manifest.chunks,
        manifest.size,
        manifest.chunkSize,
      ])
    ),
  };
}
export const encryptChunk = (
  context: FileContext,
  index: number,
  data: ArrayBuffer
) => {
  if (data.byteLength !== chunkLength(context.manifest, index))
    throw new Error('明文分块大小无效');
  return crypto.subtle.encrypt(
    chunkAlgorithm(context.manifest, index),
    context.key,
    data
  );
};
export const decryptChunk = (
  context: FileContext,
  index: number,
  data: ArrayBuffer
) => {
  if (data.byteLength !== chunkLength(context.manifest, index) + 16)
    throw new Error('密文分块大小无效');
  return crypto.subtle.decrypt(
    chunkAlgorithm(context.manifest, index),
    context.key,
    data
  );
};
export const encodeFrame = (
  index: number,
  offset: number,
  total: number,
  payload: Uint8Array
) => {
  const frame = new Uint8Array(12 + payload.length);
  const view = new DataView(frame.buffer);
  view.setUint32(0, index);
  view.setUint32(4, offset);
  view.setUint32(8, total);
  frame.set(payload, 12);
  return frame.buffer;
};
export const decodeFrame = (data: ArrayBuffer) => {
  if (data.byteLength <= 12 || data.byteLength > FRAME_SIZE)
    throw new Error('数据帧大小无效');
  const view = new DataView(data);
  const index = view.getUint32(0);
  const offset = view.getUint32(4);
  const total = view.getUint32(8);
  const payload = new Uint8Array(data, 12);
  if (total < 16 || total > CHUNK_SIZE + 16 || offset + payload.length > total)
    throw new Error('数据帧越界');
  return { index, offset, total, payload };
};
