export const CHUNK_SIZE = 1024 * 1024;
export const FRAME_SIZE = 16 * 1024;
export const MAX_FILE_SIZE = 1024 * 1024 * 1024;
const encoder = new TextEncoder();
const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const toHex = (value: ArrayBuffer) =>
  Array.from(new Uint8Array(value), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');

export const normalizeCode = (value: string) => {
  const code = value.toUpperCase().replace(/[\s-]/g, '');
  if (!/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/.test(code))
    throw new Error('请输入完整的 26 位配对码');
  return code;
};
export const generatePairingCode = () =>
  Array.from(
    crypto.getRandomValues(new Uint8Array(26)),
    (byte) => alphabet[byte & 31]
  ).join('');
export const displayPairingCode = (value: string) =>
  value.match(/.{1,5}/g)?.join('-') || value;
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

async function hkdf(
  code: string,
  salt: Uint8Array,
  info: string,
  usage: KeyUsage[],
  algorithm: 'AES-GCM' | 'HMAC'
) {
  const base = await crypto.subtle.importKey(
    'raw',
    encoder.encode(normalizeCode(code)),
    'HKDF',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info: encoder.encode(`gy-rtc/v1/${info}`),
    },
    base,
    algorithm === 'HMAC'
      ? { name: algorithm, hash: 'SHA-256', length: 256 }
      : { name: algorithm, length: 256 },
    false,
    usage
  );
}

export const receiverProof = async (code: string) => {
  const key = await hkdf(
    code,
    new Uint8Array(32),
    'receiver-proof',
    ['sign'],
    'HMAC'
  );
  return base64(await crypto.subtle.sign('HMAC', key, encoder.encode('join')));
};

export type Signal = {
  version: 1;
  roomId: string;
  generation: number;
  nonce: string;
  role: 'sender' | 'receiver';
  type: 'offer' | 'answer';
  sdp: string;
  mac: string;
};
const signalBytes = (signal: Omit<Signal, 'mac'>) =>
  encoder.encode(
    JSON.stringify([
      signal.version,
      signal.roomId,
      signal.generation,
      signal.nonce,
      signal.role,
      signal.type,
      signal.sdp,
    ])
  );
export async function signSignal(
  code: string,
  signal: Omit<Signal, 'mac'>
): Promise<Signal> {
  const key = await hkdf(
    code,
    new Uint8Array(32),
    `signal/${signal.roomId}`,
    ['sign'],
    'HMAC'
  );
  return {
    ...signal,
    mac: base64(await crypto.subtle.sign('HMAC', key, signalBytes(signal))),
  };
}
export async function verifySignal(
  code: string,
  signal: Signal,
  roomId: string
) {
  if (
    signal.version !== 1 ||
    signal.roomId !== roomId ||
    !Number.isSafeInteger(signal.generation) ||
    signal.generation < 1 ||
    signal.generation > 8 ||
    !['sender', 'receiver'].includes(signal.role) ||
    signal.type !== (signal.role === 'sender' ? 'offer' : 'answer') ||
    typeof signal.sdp !== 'string' ||
    signal.sdp.length > 48000 ||
    typeof signal.nonce !== 'string' ||
    !/^[a-f0-9-]{36}$/.test(signal.nonce)
  )
    throw new Error('信令数据无效');
  const key = await hkdf(
    code,
    new Uint8Array(32),
    `signal/${roomId}`,
    ['verify'],
    'HMAC'
  );
  if (
    !(await crypto.subtle.verify(
      'HMAC',
      key,
      unbase64(signal.mac, 32),
      signalBytes(signal)
    ))
  )
    throw new Error('配对认证失败');
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
  version: 1;
  transferId: string;
  salt: string;
  wrapIv: string;
  wrappedKey: string;
  metaIv: string;
  metadata: string;
}
export interface FileContext {
  key: CryptoKey;
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
  code: string,
  file: Pick<File, 'name' | 'size' | 'type'>
): Promise<FileContext> {
  const transferId = crypto.randomUUID();
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, [
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
  const wrappingKey = await hkdf(
    code,
    salt,
    `wrap/${transferId}`,
    ['encrypt'],
    'AES-GCM'
  );
  const wrapIv = crypto.getRandomValues(new Uint8Array(12));
  const metaIv = crypto.getRandomValues(new Uint8Array(12));
  const wrappedKey = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: wrapIv,
      additionalData: encoder.encode(`wrap/${transferId}`),
    },
    wrappingKey,
    rawKey
  );
  const metadata = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: metaIv,
      additionalData: encoder.encode(`meta/${transferId}`),
    },
    key,
    encoder.encode(JSON.stringify(manifest))
  );
  rawKey.fill(0);
  return {
    key,
    manifest,
    envelope: {
      version: 1,
      transferId,
      salt: base64(salt),
      wrapIv: base64(wrapIv),
      wrappedKey: base64(wrappedKey),
      metaIv: base64(metaIv),
      metadata: base64(metadata),
    },
  };
}

export async function openFileContext(
  code: string,
  envelope: Envelope
): Promise<FileContext> {
  if (envelope.version !== 1 || !/^[a-f0-9-]{36}$/.test(envelope.transferId))
    throw new Error('文件协议无效');
  const salt = unbase64(envelope.salt, 16);
  const wrappingKey = await hkdf(
    code,
    salt,
    `wrap/${envelope.transferId}`,
    ['decrypt'],
    'AES-GCM'
  );
  const rawKey = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: unbase64(envelope.wrapIv, 12),
      additionalData: encoder.encode(`wrap/${envelope.transferId}`),
    },
    wrappingKey,
    unbase64(envelope.wrappedKey, 48)
  );
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
  const metadata = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: unbase64(envelope.metaIv, 12),
      additionalData: encoder.encode(`meta/${envelope.transferId}`),
    },
    key,
    unbase64(envelope.metadata)
  );
  const manifest = JSON.parse(new TextDecoder().decode(metadata)) as Manifest;
  validateManifest(manifest);
  if (manifest.transferId !== envelope.transferId)
    throw new Error('文件会话不匹配');
  new Uint8Array(rawKey).fill(0);
  return { key, manifest, envelope };
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
