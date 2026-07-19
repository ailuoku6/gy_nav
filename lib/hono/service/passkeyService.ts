import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
  WebAuthnCredential,
} from '@simplewebauthn/server';

import {
  Ctx,
  PasskeyChallengeRow,
  PasskeyChallengeType,
  PasskeyCredentialRow,
} from '../types';
import UserService from './userService';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_PASSKEY_NAME = '我的 Passkey';
const REGISTRATION_CHALLENGE_FAILURE_MESSAGE =
  'Passkey challenge 已失效或不存在，请重新点击绑定 Passkey';

type SaveChallengeInput = {
  userId?: number | null;
  challenge: string;
  type: PasskeyChallengeType;
};

type ConsumeChallengeInput = {
  userId?: number | null;
  challenge: string;
  type: PasskeyChallengeType;
};

type CurrentUserRow = {
  id: number;
  userName: string;
  partData: string;
  passkeyUserId: string | null;
};

type LoginUserRow = {
  id: number;
  userName: string;
  partData: string;
};

type RegistrationBody = {
  credential: RegistrationResponseJSON;
  name?: string;
};

type LoginOptionsBody = {
  userName?: string;
};

type LoginVerifyBody = {
  credential: AuthenticationResponseJSON;
};

export default class PasskeyService {
  public static getConfig = (ctx: Ctx) => {
    const requestOrigin = PasskeyService.getRequestOrigin(ctx);
    const requestHostname = requestOrigin
      ? new URL(requestOrigin).hostname
      : undefined;

    return {
      rpID: ctx.env.PASSKEY_RP_ID || requestHostname || 'localhost',
      rpName: ctx.env.PASSKEY_RP_NAME || 'GY Nav',
      origin: ctx.env.PASSKEY_ORIGIN || requestOrigin || 'http://localhost:5173',
    };
  };

  public static saveChallenge = async (
    ctx: Ctx,
    { userId = null, challenge, type }: SaveChallengeInput
  ) => {
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();

    await ctx.env.DB.prepare(
      'INSERT INTO passkey_challenges (userId, challenge, type, expiresAt) VALUES (?, ?, ?, ?)'
    )
      .bind(userId, challenge, type, expiresAt)
      .run();
  };

  public static consumeChallenge = async (
    ctx: Ctx,
    { userId = null, challenge, type }: ConsumeChallengeInput
  ): Promise<PasskeyChallengeRow | null> => {
    const row = await PasskeyService.findChallenge(ctx, {
      userId,
      challenge,
      type,
    });

    if (!row) {
      return null;
    }

    await PasskeyService.deleteChallenge(ctx, row.id);
    return row;
  };

  public static findChallenge = async (
    ctx: Ctx,
    { userId = null, challenge, type }: ConsumeChallengeInput
  ): Promise<PasskeyChallengeRow | null> => {
    const row = await ctx.env.DB.prepare(
      'SELECT * FROM passkey_challenges WHERE challenge = ? AND type = ? ORDER BY id DESC LIMIT 1'
    )
      .bind(challenge, type)
      .first<PasskeyChallengeRow>();

    if (!row) {
      return null;
    }

    const rowUserId = row.userId ?? null;
    const isWrongRegistrationUser =
      type === 'registration' && rowUserId !== userId;
    const isWrongAuthenticationUser =
      type === 'authentication' &&
      rowUserId !== null &&
      userId !== null &&
      rowUserId !== userId;

    if (isWrongRegistrationUser || isWrongAuthenticationUser) {
      return null;
    }

    const isExpired = new Date(row.expiresAt).getTime() <= Date.now();
    if (isExpired) {
      await PasskeyService.deleteChallenge(ctx, row.id);
      return null;
    }

    return row;
  };

  public static createRegistrationOptions = async (ctx: Ctx) => {
    try {
      const user = await PasskeyService.getCurrentUser(ctx);
      if (!user) {
        return ctx.json({ result: false, msg: 'User not found' }, 404);
      }

      const passkeyUserId =
        user.passkeyUserId || (await PasskeyService.createUserHandle());
      if (!user.passkeyUserId) {
        await ctx.env.DB.prepare(
          'UPDATE users SET passkeyUserId = ? WHERE id = ?'
        )
          .bind(passkeyUserId, user.id)
          .run();
      }

      const { rpID, rpName } = PasskeyService.getConfig(ctx);
      const excludeCredentials =
        await PasskeyService.getCredentialDescriptorsForUser(ctx, user.id);
      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: user.userName,
        userID: PasskeyService.base64URLToUint8Array(passkeyUserId),
        userDisplayName: user.userName,
        attestationType: 'none',
        excludeCredentials,
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required',
        },
      });

      await PasskeyService.saveChallenge(ctx, {
        userId: user.id,
        challenge: options.challenge,
        type: 'registration',
      });

      return ctx.json({ result: true, options });
    } catch (error) {
      return ctx.json(
        { result: false, msg: PasskeyService.getErrorMessage(error) },
        500
      );
    }
  };

  public static verifyRegistration = async (
    ctx: Ctx,
    { credential, name }: RegistrationBody
  ) => {
    try {
      const user = await PasskeyService.getCurrentUser(ctx);
      if (!user) {
        return ctx.json({ result: false, msg: 'User not found' }, 404);
      }

      let consumedChallengeId: number | null = null;
      let challengeMatched = false;
      const { origin, rpID } = PasskeyService.getConfig(ctx);
      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: async (challenge) => {
          const matchedChallenge = await PasskeyService.findChallenge(ctx, {
            userId: user.id,
            challenge,
            type: 'registration',
          });
          consumedChallengeId = matchedChallenge?.id ?? null;
          challengeMatched = matchedChallenge !== null;
          return challengeMatched;
        },
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
      });

      if (!verification.verified || !verification.registrationInfo) {
        PasskeyService.logVerificationFailure(
          ctx,
          'registration',
          new Error('Registration response was not verified')
        );
        return ctx.json({
          result: false,
          msg: challengeMatched
            ? 'Passkey verification failed'
            : REGISTRATION_CHALLENGE_FAILURE_MESSAGE,
        });
      }

      const {
        credential: verifiedCredential,
        credentialDeviceType,
        credentialBackedUp,
      } = verification.registrationInfo;

      await ctx.env.DB.prepare(
        'INSERT INTO passkey_credentials (userId, credentialId, publicKey, counter, transports, deviceType, backedUp, name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(
          user.id,
          verifiedCredential.id,
          PasskeyService.uint8ArrayToBase64URL(verifiedCredential.publicKey),
          verifiedCredential.counter,
          PasskeyService.stringifyTransports(verifiedCredential.transports),
          credentialDeviceType,
          credentialBackedUp ? 1 : 0,
          name || DEFAULT_PASSKEY_NAME
        )
        .run();

      if (consumedChallengeId !== null) {
        await PasskeyService.deleteChallenge(ctx, consumedChallengeId);
      }

      return ctx.json({
        result: true,
        msg: 'Passkey binding successful',
      });
    } catch (error) {
      PasskeyService.logVerificationFailure(ctx, 'registration', error);
      return ctx.json({
        result: false,
        msg: PasskeyService.getRegistrationFailureMessage(error),
      });
    }
  };

  public static createLoginOptions = async (
    ctx: Ctx,
    { userName }: LoginOptionsBody
  ) => {
    try {
      const { rpID } = PasskeyService.getConfig(ctx);
      const trimmedUserName = userName?.trim();
      let userId: number | null = null;
      let allowCredentials:
        | { id: string; transports?: AuthenticatorTransportFuture[] }[]
        | undefined;

      if (trimmedUserName) {
        const user = await PasskeyService.getUserByName(ctx, trimmedUserName);
        if (!user) {
          return ctx.json({
            result: false,
            msg: 'Passkey verification failed',
          });
        }
        userId = user.id;
        allowCredentials = await PasskeyService.getCredentialDescriptorsForUser(
          ctx,
          user.id
        );
        if (allowCredentials.length === 0) {
          return ctx.json({
            result: false,
            msg: 'Passkey verification failed',
          });
        }
      }

      const optionsInput = {
        rpID,
        userVerification: 'required' as const,
        ...(allowCredentials ? { allowCredentials } : {}),
      };
      const options = await generateAuthenticationOptions(optionsInput);

      await PasskeyService.saveChallenge(ctx, {
        userId,
        challenge: options.challenge,
        type: 'authentication',
      });

      return ctx.json({ result: true, options });
    } catch (error) {
      return ctx.json(
        { result: false, msg: PasskeyService.getErrorMessage(error) },
        500
      );
    }
  };

  public static verifyLogin = async (
    ctx: Ctx,
    { credential }: LoginVerifyBody
  ) => {
    try {
      const credentialRow = await ctx.env.DB.prepare(
        'SELECT * FROM passkey_credentials WHERE credentialId = ?'
      )
        .bind(credential.id)
        .first<PasskeyCredentialRow>();

      if (!credentialRow) {
        return ctx.json({
          result: false,
          msg: 'Passkey verification failed',
        });
      }

      let consumedChallengeId: number | null = null;
      const { origin, rpID } = PasskeyService.getConfig(ctx);
      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: async (challenge) => {
          const matchedChallenge = await PasskeyService.findChallenge(ctx, {
            userId: credentialRow.userId,
            challenge,
            type: 'authentication',
          });
          consumedChallengeId = matchedChallenge?.id ?? null;
          return matchedChallenge !== null;
        },
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: PasskeyService.toWebAuthnCredential(credentialRow),
        requireUserVerification: true,
      });

      if (!verification.verified) {
        PasskeyService.logVerificationFailure(
          ctx,
          'authentication',
          new Error('Authentication response was not verified')
        );
        return ctx.json({
          result: false,
          msg: 'Passkey verification failed',
        });
      }

      if (consumedChallengeId !== null) {
        await PasskeyService.deleteChallenge(ctx, consumedChallengeId);
      }

      await ctx.env.DB.prepare(
        'UPDATE passkey_credentials SET counter = ?, lastUsedAt = CURRENT_TIMESTAMP WHERE credentialId = ?'
      )
        .bind(
          verification.authenticationInfo.newCounter,
          verification.authenticationInfo.credentialID
        )
        .run();

      const user = await PasskeyService.getLoginUserById(
        ctx,
        credentialRow.userId
      );
      if (!user) {
        return ctx.json({ result: false, msg: 'User not found' }, 404);
      }

      return ctx.json(await UserService.buildLoginSuccessPayload(ctx, user));
    } catch (error) {
      PasskeyService.logVerificationFailure(ctx, 'authentication', error);
      return ctx.json({
        result: false,
        msg: 'Passkey verification failed',
      });
    }
  };

  public static listCredentials = async (ctx: Ctx) => {
    try {
      const userId = PasskeyService.getCurrentUserId(ctx);
      const rows = await ctx.env.DB.prepare(
        'SELECT id, name, createdAt, lastUsedAt, transports FROM passkey_credentials WHERE userId = ? ORDER BY createdAt DESC'
      )
        .bind(userId)
        .all<Pick<
          PasskeyCredentialRow,
          'id' | 'name' | 'createdAt' | 'lastUsedAt' | 'transports'
        >>();

      return ctx.json({
        result: true,
        credentials: (rows.results ?? []).map((row) => ({
          ...row,
          name: row.name || DEFAULT_PASSKEY_NAME,
          transports: PasskeyService.parseTransports(row.transports),
        })),
      });
    } catch (error) {
      return ctx.json(
        { result: false, msg: PasskeyService.getErrorMessage(error) },
        500
      );
    }
  };

  public static deleteCredential = async (
    ctx: Ctx,
    { id }: { id: number }
  ) => {
    try {
      const userId = PasskeyService.getCurrentUserId(ctx);
      const credential = await ctx.env.DB.prepare(
        'SELECT * FROM passkey_credentials WHERE id = ?'
      )
        .bind(id)
        .first<PasskeyCredentialRow>();

      if (!credential || credential.userId !== userId) {
        return ctx.json({ result: false, msg: 'Passkey not found' });
      }

      await ctx.env.DB.prepare(
        'DELETE FROM passkey_credentials WHERE id = ? AND userId = ?'
      )
        .bind(id, userId)
        .run();

      return ctx.json({ result: true, msg: 'Passkey deleted' });
    } catch (error) {
      return ctx.json(
        { result: false, msg: PasskeyService.getErrorMessage(error) },
        500
      );
    }
  };

  private static deleteChallenge = async (ctx: Ctx, id: number) => {
    await ctx.env.DB.prepare('DELETE FROM passkey_challenges WHERE id = ?')
      .bind(id)
      .run();
  };

  private static getRequestOrigin = (ctx: Ctx) => {
    try {
      return new URL(ctx.req.url).origin;
    } catch {
      return undefined;
    }
  };

  private static logVerificationFailure = (
    ctx: Ctx,
    flow: 'registration' | 'authentication',
    error: unknown
  ) => {
    const { origin, rpID } = PasskeyService.getConfig(ctx);
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[passkey] verification failed', {
      flow,
      message,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requestOrigin: PasskeyService.getRequestOrigin(ctx),
    });
  };

  private static getCurrentUserId = (ctx: Ctx) => {
    const payloadJson = ctx.get('jwtPayload');
    return (payloadJson as { user: { id: number } }).user.id;
  };

  private static getCurrentUser = async (ctx: Ctx) => {
    const userId = PasskeyService.getCurrentUserId(ctx);
    return await ctx.env.DB.prepare(
      'SELECT id, userName, partData, passkeyUserId FROM users WHERE id = ?'
    )
      .bind(userId)
      .first<CurrentUserRow>();
  };

  private static getLoginUserById = async (ctx: Ctx, userId: number) => {
    return await ctx.env.DB.prepare(
      'SELECT id, userName, partData FROM users WHERE id = ?'
    )
      .bind(userId)
      .first<LoginUserRow>();
  };

  private static getUserByName = async (ctx: Ctx, userName: string) => {
    return await ctx.env.DB.prepare(
      'SELECT id, userName, partData FROM users WHERE userName = ?'
    )
      .bind(userName)
      .first<LoginUserRow>();
  };

  private static getCredentialDescriptorsForUser = async (
    ctx: Ctx,
    userId: number
  ) => {
    const rows = await ctx.env.DB.prepare(
      'SELECT credentialId, transports FROM passkey_credentials WHERE userId = ?'
    )
      .bind(userId)
      .all<Pick<PasskeyCredentialRow, 'credentialId' | 'transports'>>();

    return (rows.results ?? []).map((row) => ({
      id: row.credentialId,
      transports: PasskeyService.parseTransports(row.transports),
    }));
  };

  private static createUserHandle = async () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return PasskeyService.uint8ArrayToBase64URL(bytes);
  };

  private static toWebAuthnCredential = (
    credential: PasskeyCredentialRow
  ): WebAuthnCredential => ({
    id: credential.credentialId,
    publicKey: PasskeyService.base64URLToUint8Array(credential.publicKey),
    counter: credential.counter,
    transports: PasskeyService.parseTransports(credential.transports),
  });

  private static stringifyTransports = (
    transports?: AuthenticatorTransportFuture[]
  ) => {
    return transports ? JSON.stringify(transports) : null;
  };

  private static parseTransports = (transports: string | null) => {
    if (!transports) {
      return undefined;
    }

    try {
      return JSON.parse(transports) as AuthenticatorTransportFuture[];
    } catch {
      return undefined;
    }
  };

  private static uint8ArrayToBase64URL = (bytes: Uint8Array) => {
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  };

  private static base64URLToUint8Array = (value: string) => {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    );
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  };

  private static getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'Unexpected error';
  };

  private static getRegistrationFailureMessage = (error: unknown) => {
    const message = PasskeyService.getErrorMessage(error);

    if (message.includes('Custom challenge verifier returned false')) {
      return REGISTRATION_CHALLENGE_FAILURE_MESSAGE;
    }

    if (message.includes('Unexpected registration response origin')) {
      return `Passkey origin 校验失败：${message}`;
    }

    if (message.includes('Unexpected registration response RP ID')) {
      return `Passkey RP ID 校验失败：${message}`;
    }

    if (
      message.includes('D1_') ||
      message.includes('SQLITE_') ||
      message.includes('no such table') ||
      message.includes('no such column') ||
      message.includes('UNIQUE constraint failed')
    ) {
      return `Passkey 保存失败：${message}`;
    }

    return `Passkey verification failed: ${message}`;
  };
}
