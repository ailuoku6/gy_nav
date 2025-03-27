import { Context } from 'hono';

import { BlankInput } from 'hono/types';

export interface IFriendSite {
  site_name: string;
  url: string;
}

export interface IUser {
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
  DB: D1Database;
};

export type Ctx<P extends string = any> = Context<
  {
    Bindings: Bindings;
  },
  P,
  BlankInput
>;
