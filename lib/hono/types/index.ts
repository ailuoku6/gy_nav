import { Context } from 'hono';

import { BlankInput } from 'hono/types';

export interface IFriendSite {
  site_name: string;
  url: string;
}

export interface IUser {
  id?: number;
  userName: string;
  passWord: string;
  emailAddr: string;
  verifyCode: string;
  outDate: Date;
  partData: string;
}

export type Bindings = {
  //   MY_KV: KVNamespace;
  DataSecretKey: string;
  PasswordSecret: string;
  TokenSecret: string;
  PASSKEY_RP_ID?: string;
  PASSKEY_RP_NAME?: string;
  PASSKEY_ORIGIN?: string;
  DB: D1Database;
};

export type PasskeyChallengeType = 'registration' | 'authentication';

export interface PasskeyChallengeRow {
  id: number;
  userId: number | null;
  challenge: string;
  type: PasskeyChallengeType;
  expiresAt: string;
  createdAt: string;
}

export interface PasskeyCredentialRow {
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
}

export type Ctx<P extends string = any> = Context<
  {
    Bindings: Bindings;
  },
  P,
  BlankInput
>;
