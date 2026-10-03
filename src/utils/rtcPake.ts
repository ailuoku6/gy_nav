import { ristretto255 } from '@cipherman/pake-js/cpace';
import { base64, normalizeCode, unbase64 } from './rtcCrypto';

const encoder = new TextEncoder();
const PBKDF2_ROUNDS = 100_000;
const ROLE_AD = {
  sender: encoder.encode('gy-nav/webrtc/v2/sender'),
  receiver: encoder.encode('gy-nav/webrtc/v2/receiver'),
} as const;
export interface PakeEphemeral {
  sid: Uint8Array;
  ephemeralSecret: Uint8Array;
  share: Uint8Array;
  role: 'sender' | 'receiver';
  roomId: string;
}

async function passwordRelatedString(code: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(normalizeCode(code)),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: encoder.encode('gy-nav/webrtc/v2/CPace/PRS'),
        iterations: PBKDF2_ROUNDS,
      },
      key,
      512
    )
  );
}

export async function createPakeEphemeral(
  code: string,
  sid: Uint8Array,
  roomId: string,
  role: PakeEphemeral['role']
): Promise<PakeEphemeral> {
  if (sid.length !== 32 || !/^[a-f0-9]{64}$/.test(roomId))
    throw new Error('配对会话参数无效');
  const PRS = await passwordRelatedString(code);
  try {
    const CI = encoder.encode(`gy-nav/webrtc/v2/room/${roomId}`);
    const state = ristretto255.init({ PRS, sid, CI });
    return {
      sid: sid.slice(),
      ephemeralSecret: state.ephemeralSecret,
      share: state.share,
      role,
      roomId,
    };
  } finally {
    PRS.fill(0);
  }
}

export function derivePakeSessionKey(
  state: PakeEphemeral,
  peerShare: Uint8Array
) {
  if (peerShare.length !== 32) throw new Error('CPace 公钥长度无效');
  const role = state.role === 'sender' ? 'initiator' : 'responder';
  const isk = ristretto255.deriveIskInitiatorResponder({
    ephemeralSecret: state.ephemeralSecret,
    ownShare: state.share,
    peerShare,
    ownAD: ROLE_AD[state.role],
    peerAD: ROLE_AD[state.role === 'sender' ? 'receiver' : 'sender'],
    sid: state.sid,
    role,
  });
  state.ephemeralSecret.fill(0);
  const result = isk.slice();
  isk.fill(0);
  return result;
}

async function confirmationKey(isk: Uint8Array) {
  const material = await crypto.subtle.importKey('raw', isk, 'HKDF', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32),
      info: encoder.encode('gy-nav/webrtc/v2/CPace/key-confirmation'),
    },
    material,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign', 'verify']
  );
}
export async function createPakeConfirmation(
  isk: Uint8Array,
  role: PakeEphemeral['role']
) {
  const key = await confirmationKey(isk);
  return base64(
    await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(`gy-nav/webrtc/v2/confirmed/${role}`)
    )
  );
}
export async function verifyPakeConfirmation(
  isk: Uint8Array,
  role: PakeEphemeral['role'],
  proof: string
) {
  const key = await confirmationKey(isk);
  if (
    !(await crypto.subtle.verify(
      'HMAC',
      key,
      unbase64(proof, 32),
      encoder.encode(`gy-nav/webrtc/v2/confirmed/${role}`)
    ))
  )
    throw new Error('配对码验证失败');
}
export function encodePakeBytes(value: Uint8Array) {
  return base64(value);
}
export function decodePakeBytes(value: string, expected: number) {
  return unbase64(value, expected);
}
export function pakeSid(value: string) {
  return decodePakeBytes(value, 32);
}
