import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: vi.fn(async (options) => ({
    challenge: 'registration-challenge',
    ...options,
  })),
  verifyRegistrationResponse: vi.fn(async (options) => {
    const challengeMatches = await options.expectedChallenge(
      'registration-challenge'
    );
    return {
      verified: challengeMatches,
      registrationInfo: challengeMatches
        ? {
            credential: {
              id: 'new-credential-id',
              publicKey: new Uint8Array([1, 2, 3]),
              counter: 9,
              transports: ['internal'],
            },
            credentialDeviceType: 'multiDevice',
            credentialBackedUp: true,
          }
        : undefined,
    };
  }),
  generateAuthenticationOptions: vi.fn(async (options) => ({
    challenge: 'authentication-challenge',
    ...options,
  })),
  verifyAuthenticationResponse: vi.fn(async (options) => {
    const challengeMatches = await options.expectedChallenge(
      'authentication-challenge'
    );
    return {
      verified: challengeMatches,
      authenticationInfo: {
        credentialID: 'credential-alice',
        newCounter: 10,
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
      },
    };
  }),
}));

import PasskeyService from './passkeyService';
import UserService from './userService';
import { Ctx } from '../types';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';

class PreparedStatementStub {
  private params: unknown[] = [];

  constructor(private readonly row: Record<string, unknown> | null) {}

  bind(...params: unknown[]) {
    this.params = params;
    return this;
  }

  async first() {
    expect(this.params).toEqual([7]);
    return this.row;
  }
}

function createCtx(popularSites: string): Ctx {
  return {
    env: {
      TokenSecret: 'test-secret',
      DataSecretKey: 'data-secret',
      PasswordSecret: 'password-secret',
      DB: {
        prepare(sql: string) {
          expect(sql).toBe('SELECT popularSites FROM popularSites WHERE userId = ?');
          return new PreparedStatementStub({ popularSites });
        },
      } as unknown as D1Database,
    },
  } as Ctx;
}

describe('UserService.buildLoginSuccessPayload', () => {
  it('builds the shared login success shape with a JWT and popular sites', async () => {
    const payload = await UserService.buildLoginSuccessPayload(createCtx('[{"name":"docs"}]'), {
      id: 7,
      userName: 'alice',
      partData: '[{"name":"main"}]',
    });

    expect(payload.result).toBe(true);
    expect(payload.user).toEqual({
      id: 7,
      userName: 'alice',
      partData: '[{"name":"main"}]',
      popularSites: '[{"name":"docs"}]',
    });
    expect(payload.msg).toBe('Login successful');
    expect(payload.token).toEqual(expect.any(String));
  });
});

type ChallengeRow = {
  id: number;
  userId: number | null;
  challenge: string;
  type: string;
  expiresAt: string;
  createdAt: string;
};

type UserRow = {
  id: number;
  userName: string;
  partData: string;
  passkeyUserId: string | null;
};

type CredentialRow = {
  id: number;
  userId: number;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string | null;
  deviceType: string | null;
  backedUp: number;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

class PasskeyDbStub {
  public challenges: ChallengeRow[] = [];
  public credentials: CredentialRow[] = [];
  public users: UserRow[] = [
    {
      id: 7,
      userName: 'alice',
      partData: '[{"name":"main"}]',
      passkeyUserId: null,
    },
    {
      id: 8,
      userName: 'bob',
      partData: '[]',
      passkeyUserId: 'bob-handle',
    },
  ];
  public deletedIds: number[] = [];

  prepare(sql: string) {
    return {
      bind: (...params: unknown[]) => ({
        first: async () => {
          if (sql.startsWith('SELECT id, userName, partData, passkeyUserId FROM users WHERE id = ?')) {
            const [userId] = params;
            return this.users.find((user) => user.id === userId) ?? null;
          }
          if (sql.startsWith('SELECT id, userName, partData FROM users WHERE id = ?')) {
            const [userId] = params;
            const user = this.users.find((row) => row.id === userId);
            return user
              ? {
                  id: user.id,
                  userName: user.userName,
                  partData: user.partData,
                }
              : null;
          }
          if (sql.startsWith('SELECT id, userName, partData FROM users WHERE userName = ?')) {
            const [userName] = params;
            const user = this.users.find((row) => row.userName === userName);
            return user
              ? {
                  id: user.id,
                  userName: user.userName,
                  partData: user.partData,
                }
              : null;
          }
          if (sql.startsWith('SELECT * FROM passkey_credentials WHERE credentialId = ?')) {
            const [credentialId] = params;
            return (
              this.credentials.find((row) => row.credentialId === credentialId) ??
              null
            );
          }
          if (sql.startsWith('SELECT * FROM passkey_credentials WHERE id = ?')) {
            const [id] = params;
            return this.credentials.find((row) => row.id === id) ?? null;
          }
          if (sql.startsWith('SELECT * FROM passkey_challenges')) {
            const [challenge, type] = params;
            return (
              this.challenges.find(
                (row) => row.challenge === challenge && row.type === type
              ) ?? null
            );
          }
          return null;
        },
        all: async () => {
          if (sql.startsWith('SELECT credentialId, transports FROM passkey_credentials WHERE userId = ?')) {
            const [userId] = params;
            return {
              results: this.credentials
                .filter((row) => row.userId === userId)
                .map((row) => ({
                  credentialId: row.credentialId,
                  transports: row.transports,
                })),
            };
          }
          if (sql.startsWith('SELECT id, name, createdAt, lastUsedAt, transports FROM passkey_credentials WHERE userId = ?')) {
            const [userId] = params;
            return {
              results: this.credentials
                .filter((row) => row.userId === userId)
                .map(({ id, name, createdAt, lastUsedAt, transports }) => ({
                  id,
                  name,
                  createdAt,
                  lastUsedAt,
                  transports,
                })),
            };
          }
          return { results: [] };
        },
        run: async () => {
          if (sql.startsWith('UPDATE users SET passkeyUserId = ? WHERE id = ?')) {
            const [passkeyUserId, id] = params;
            const user = this.users.find((row) => row.id === id);
            if (user) {
              user.passkeyUserId = String(passkeyUserId);
            }
          }
          if (sql.startsWith('INSERT INTO passkey_challenges')) {
            const [userId, challenge, type, expiresAt] = params;
            this.challenges.push({
              id: this.challenges.length + 1,
              userId: typeof userId === 'number' ? userId : null,
              challenge: String(challenge),
              type: String(type),
              expiresAt: String(expiresAt),
              createdAt: new Date().toISOString(),
            });
          }
          if (sql.startsWith('INSERT INTO passkey_credentials')) {
            const [
              userId,
              credentialId,
              publicKey,
              counter,
              transports,
              deviceType,
              backedUp,
              name,
            ] = params;
            this.credentials.push({
              id: this.credentials.length + 1,
              userId: Number(userId),
              credentialId: String(credentialId),
              publicKey: String(publicKey),
              counter: Number(counter),
              transports: transports ? String(transports) : null,
              deviceType: deviceType ? String(deviceType) : null,
              backedUp: Number(backedUp),
              name: name ? String(name) : null,
              createdAt: '2026-07-19 10:00:00',
              lastUsedAt: null,
            });
          }
          if (sql.startsWith('UPDATE passkey_credentials SET counter = ?')) {
            const [counter, credentialId] = params;
            const credential = this.credentials.find(
              (row) => row.credentialId === credentialId
            );
            if (credential) {
              credential.counter = Number(counter);
              credential.lastUsedAt = 'updated';
            }
          }
          if (sql.startsWith('DELETE FROM passkey_challenges WHERE id = ?')) {
            const [id] = params;
            this.deletedIds.push(Number(id));
            this.challenges = this.challenges.filter((row) => row.id !== id);
          }
          if (sql.startsWith('DELETE FROM passkey_credentials WHERE id = ? AND userId = ?')) {
            const [id, userId] = params;
            const initialLength = this.credentials.length;
            this.credentials = this.credentials.filter(
              (row) => !(row.id === id && row.userId === userId)
            );
            return { success: true, meta: { changes: initialLength - this.credentials.length } };
          }
          return { success: true };
        },
      }),
    };
  }
}

function createPasskeyCtx(
  db: PasskeyDbStub,
  env: Partial<Ctx['env']> = {}
): Ctx {
  return {
    env: {
      TokenSecret: 'test-secret',
      DataSecretKey: 'data-secret',
      PasswordSecret: 'password-secret',
      DB: db as unknown as D1Database,
      ...env,
    },
    get: (key: string) => {
      if (key === 'jwtPayload') {
        return { user: { id: 7, userName: 'alice' } };
      }
      return undefined;
    },
    json: (body: unknown, status?: number) =>
      new Response(JSON.stringify(body), {
        status: status ?? 200,
        headers: { 'content-type': 'application/json' },
      }),
  } as Ctx;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PasskeyService config and challenges', () => {
  it('uses local Passkey config defaults when env values are absent', () => {
    const db = new PasskeyDbStub();

    expect(PasskeyService.getConfig(createPasskeyCtx(db))).toEqual({
      rpID: 'localhost',
      rpName: 'GY Nav',
      origin: 'http://localhost:5173',
    });
  });

  it('uses Passkey env values when provided', () => {
    const db = new PasskeyDbStub();

    expect(
      PasskeyService.getConfig(
        createPasskeyCtx(db, {
          PASSKEY_RP_ID: 'nav.example.com',
          PASSKEY_RP_NAME: 'GY Navigation',
          PASSKEY_ORIGIN: 'https://nav.example.com',
        })
      )
    ).toEqual({
      rpID: 'nav.example.com',
      rpName: 'GY Navigation',
      origin: 'https://nav.example.com',
    });
  });

  it('saves and consumes a registration challenge only once for the same user', async () => {
    const db = new PasskeyDbStub();
    const ctx = createPasskeyCtx(db);

    await PasskeyService.saveChallenge(ctx, {
      userId: 7,
      challenge: 'register-challenge',
      type: 'registration',
    });

    const consumed = await PasskeyService.consumeChallenge(ctx, {
      userId: 7,
      challenge: 'register-challenge',
      type: 'registration',
    });
    const consumedAgain = await PasskeyService.consumeChallenge(ctx, {
      userId: 7,
      challenge: 'register-challenge',
      type: 'registration',
    });

    expect(consumed?.challenge).toBe('register-challenge');
    expect(consumed?.userId).toBe(7);
    expect(consumedAgain).toBeNull();
    expect(db.deletedIds).toEqual([1]);
  });

  it('rejects expired challenges and removes them', async () => {
    const db = new PasskeyDbStub();
    db.challenges.push({
      id: 1,
      userId: null,
      challenge: 'expired-challenge',
      type: 'authentication',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    await expect(
      PasskeyService.consumeChallenge(createPasskeyCtx(db), {
        challenge: 'expired-challenge',
        type: 'authentication',
      })
    ).resolves.toBeNull();
    expect(db.deletedIds).toEqual([1]);
  });
});

describe('PasskeyService registration', () => {
  it('creates registration options with a stable user handle and excludes existing credentials', async () => {
    const db = new PasskeyDbStub();
    db.credentials.push({
      id: 1,
      userId: 7,
      credentialId: 'existing-credential',
      publicKey: 'AQID',
      counter: 0,
      transports: '["internal","hybrid"]',
      deviceType: 'multiDevice',
      backedUp: 1,
      name: 'MacBook',
      createdAt: '2026-07-19 10:00:00',
      lastUsedAt: null,
    });

    const response = await PasskeyService.createRegistrationOptions(
      createPasskeyCtx(db)
    );
    const body = await response.json();

    expect(body.result).toBe(true);
    expect(body.options.challenge).toBe('registration-challenge');
    expect(db.users[0].passkeyUserId).toEqual(expect.any(String));
    expect(db.challenges).toMatchObject([
      {
        userId: 7,
        challenge: 'registration-challenge',
        type: 'registration',
      },
    ]);
    expect(generateRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        rpName: 'GY Nav',
        rpID: 'localhost',
        userName: 'alice',
        userDisplayName: 'alice',
        attestationType: 'none',
        excludeCredentials: [
          {
            id: 'existing-credential',
            transports: ['internal', 'hybrid'],
          },
        ],
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required',
        },
      })
    );

    const firstHandle = db.users[0].passkeyUserId;
    await PasskeyService.createRegistrationOptions(createPasskeyCtx(db));
    expect(db.users[0].passkeyUserId).toBe(firstHandle);
  });

  it('verifies registration and stores the credential for the current user', async () => {
    const db = new PasskeyDbStub();
    db.users[0].passkeyUserId = 'alice-handle';
    db.challenges.push({
      id: 1,
      userId: 7,
      challenge: 'registration-challenge',
      type: 'registration',
      expiresAt: new Date(Date.now() + 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    const response = await PasskeyService.verifyRegistration(createPasskeyCtx(db), {
      credential: { response: { clientDataJSON: 'client-data' } },
      name: 'My Passkey',
    });
    const body = await response.json();

    expect(body).toEqual({
      result: true,
      msg: 'Passkey binding successful',
    });
    expect(verifyRegistrationResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedChallenge: expect.any(Function),
        expectedOrigin: 'http://localhost:5173',
        expectedRPID: 'localhost',
        requireUserVerification: true,
      })
    );
    expect(db.credentials[0]).toMatchObject({
      userId: 7,
      credentialId: 'new-credential-id',
      publicKey: 'AQID',
      counter: 9,
      transports: '["internal"]',
      deviceType: 'multiDevice',
      backedUp: 1,
      name: 'My Passkey',
    });
    expect(db.deletedIds).toEqual([1]);
  });
});

describe('PasskeyService login and credential management', () => {
  it('creates discoverable login options when username is empty', async () => {
    const db = new PasskeyDbStub();

    const response = await PasskeyService.createLoginOptions(createPasskeyCtx(db), {
      userName: '',
    });
    const body = await response.json();

    expect(body.result).toBe(true);
    expect(body.options.challenge).toBe('authentication-challenge');
    expect(generateAuthenticationOptions).toHaveBeenCalledWith({
      rpID: 'localhost',
      userVerification: 'required',
    });
    expect(db.challenges).toMatchObject([
      {
        userId: null,
        challenge: 'authentication-challenge',
        type: 'authentication',
      },
    ]);
  });

  it('creates username-scoped login options with only that users credentials', async () => {
    const db = new PasskeyDbStub();
    db.credentials.push(
      {
        id: 1,
        userId: 7,
        credentialId: 'credential-alice',
        publicKey: 'AQID',
        counter: 0,
        transports: '["internal"]',
        deviceType: 'multiDevice',
        backedUp: 1,
        name: 'Alice',
        createdAt: '2026-07-19 10:00:00',
        lastUsedAt: null,
      },
      {
        id: 2,
        userId: 8,
        credentialId: 'credential-bob',
        publicKey: 'AQID',
        counter: 0,
        transports: '["hybrid"]',
        deviceType: 'multiDevice',
        backedUp: 1,
        name: 'Bob',
        createdAt: '2026-07-19 10:00:00',
        lastUsedAt: null,
      }
    );

    await PasskeyService.createLoginOptions(createPasskeyCtx(db), {
      userName: 'alice',
    });

    expect(generateAuthenticationOptions).toHaveBeenCalledWith({
      rpID: 'localhost',
      userVerification: 'required',
      allowCredentials: [
        {
          id: 'credential-alice',
          transports: ['internal'],
        },
      ],
    });
  });

  it('returns a generic failure for unknown login credentials', async () => {
    const db = new PasskeyDbStub();

    const response = await PasskeyService.verifyLogin(createPasskeyCtx(db), {
      credential: { id: 'missing-credential' },
    });
    const body = await response.json();

    expect(body).toEqual({
      result: false,
      msg: 'Passkey verification failed',
    });
    expect(verifyAuthenticationResponse).not.toHaveBeenCalled();
  });

  it('verifies login, updates credential usage, and returns the shared login payload', async () => {
    const db = new PasskeyDbStub();
    db.credentials.push({
      id: 1,
      userId: 7,
      credentialId: 'credential-alice',
      publicKey: 'AQID',
      counter: 2,
      transports: '["internal"]',
      deviceType: 'multiDevice',
      backedUp: 1,
      name: 'Alice',
      createdAt: '2026-07-19 10:00:00',
      lastUsedAt: null,
    });
    db.challenges.push({
      id: 1,
      userId: null,
      challenge: 'authentication-challenge',
      type: 'authentication',
      expiresAt: new Date(Date.now() + 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    const response = await PasskeyService.verifyLogin(createPasskeyCtx(db), {
      credential: { id: 'credential-alice' },
    });
    const body = await response.json();

    expect(body.result).toBe(true);
    expect(body.user).toMatchObject({
      id: 7,
      userName: 'alice',
      partData: '[{"name":"main"}]',
    });
    expect(body.token).toEqual(expect.any(String));
    expect(db.credentials[0].counter).toBe(10);
    expect(db.credentials[0].lastUsedAt).toBe('updated');
    expect(db.deletedIds).toEqual([1]);
    expect(verifyAuthenticationResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedChallenge: expect.any(Function),
        expectedOrigin: 'http://localhost:5173',
        expectedRPID: 'localhost',
        requireUserVerification: true,
        credential: {
          id: 'credential-alice',
          publicKey: new Uint8Array([1, 2, 3]),
          counter: 2,
          transports: ['internal'],
        },
      })
    );
  });

  it('lists credentials for the current user', async () => {
    const db = new PasskeyDbStub();
    db.credentials.push({
      id: 1,
      userId: 7,
      credentialId: 'credential-alice',
      publicKey: 'AQID',
      counter: 0,
      transports: '["internal","hybrid"]',
      deviceType: 'multiDevice',
      backedUp: 1,
      name: 'MacBook',
      createdAt: '2026-07-19 10:00:00',
      lastUsedAt: null,
    });

    const response = await PasskeyService.listCredentials(createPasskeyCtx(db));
    const body = await response.json();

    expect(body).toEqual({
      result: true,
      credentials: [
        {
          id: 1,
          name: 'MacBook',
          createdAt: '2026-07-19 10:00:00',
          lastUsedAt: null,
          transports: ['internal', 'hybrid'],
        },
      ],
    });
  });

  it('does not delete credentials owned by another user', async () => {
    const db = new PasskeyDbStub();
    db.credentials.push({
      id: 2,
      userId: 8,
      credentialId: 'credential-bob',
      publicKey: 'AQID',
      counter: 0,
      transports: '["hybrid"]',
      deviceType: 'multiDevice',
      backedUp: 1,
      name: 'Bob',
      createdAt: '2026-07-19 10:00:00',
      lastUsedAt: null,
    });

    const response = await PasskeyService.deleteCredential(createPasskeyCtx(db), {
      id: 2,
    });
    const body = await response.json();

    expect(body).toEqual({
      result: false,
      msg: 'Passkey not found',
    });
    expect(db.credentials).toHaveLength(1);
  });
});
