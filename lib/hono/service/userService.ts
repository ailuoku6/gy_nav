import { Ctx, IUser } from '../types';

import encrypt from '../utils/encrypt';

import { signToken } from '../utils/sign';

export default class UserService {
  public static buildLoginSuccessPayload = async (
    ctx: Ctx,
    user: { id: number; userName: string; partData: string }
  ) => {
    const tokenSecret = ctx.env.TokenSecret;
    const userToken = {
      id: user.id,
      userName: user.userName,
    };

    const token = await signToken({ user: userToken }, tokenSecret);
    const popularSitesRow = await ctx.env.DB
      .prepare('SELECT popularSites FROM popularSites WHERE userId = ?')
      .bind(user.id)
      .first();
    const popularSites = popularSitesRow?.popularSites ?? '';

    return {
      result: true,
      user: {
        id: user.id,
        userName: user.userName,
        partData: user.partData,
        popularSites,
      },
      msg: 'Login successful',
      token,
    };
  };

  public static login = async (
    ctx: Ctx,
    { userName, passWord }: { userName: string; passWord: string }
  ) => {
    try {
      const db = ctx.env.DB;
      const user = await db
        .prepare('SELECT * FROM users WHERE userName = ?')
        .bind(userName)
        .first();

      if (!user) {
        return ctx.json({ result: false, msg: 'Invalid username or password' });
      }

      const valiPass = await encrypt(passWord);

      // 验证密码
      const isPasswordValid = valiPass === user.passWord;
      if (!isPasswordValid) {
        return ctx.json({ result: false, msg: 'Invalid username or password' });
      }

      return ctx.json(await UserService.buildLoginSuccessPayload(ctx, user as any));
    } catch (error: any) {
      return ctx.json({ result: false, msg: error.message }, 500);
    }
  };
  public static signUp = async (
    ctx: Ctx,
    {
      userName,
      passWord,
      partData,
    }: { userName: string; passWord: string; partData: string | object }
  ) => {
    try {
      const tokenSecret = ctx.env.TokenSecret;

      // 加密密码
      const hashedPassword = await encrypt(passWord);

      const db = ctx.env.DB;
      const result = await db
        .prepare(
          'INSERT INTO users (userName, passWord, partData) VALUES (?, ?, ?)'
        )
        .bind(
          userName,
          hashedPassword,
          typeof partData === 'string' ? partData : JSON.stringify(partData)
        )
        .run();

      if (result.success) {
        // 获取新注册用户的ID
        const user = await db
          .prepare(
            'SELECT id, userName, partData FROM users WHERE userName = ?'
          )
          .bind(userName)
          .first();
        if (user) {
          const userToken = {
            id: user.id,
            userName: user.userName,
          };
          const token = await signToken({ user: userToken }, tokenSecret);
          return ctx.json({
            result: true,
            user: { ...user, popularSites: '' },
            msg: '',
            token,
          });
        } else {
          return ctx.json({ result: false, msg: 'User registration failed' });
        }
      } else {
        return ctx.json({ result: false, msg: 'User registration failed' });
      }
    } catch (error: any) {
      return ctx.json({ result: false, msg: error.message });
    }
  };
}
