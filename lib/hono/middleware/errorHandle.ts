import { Ctx } from '../types';

import { Next } from 'hono';

const errorHandle = async (ctx: Ctx, next: Next) => {
  return next().catch((err: any) => {
    if (err.status === 401) {
      // ctx.status = 401
      // ctx.body = {
      //   message: '尚未登陆',
      //   type: 'error',
      // }
    } else if (err.status === 403) {
      // ctx.status = 403
      // ctx.body = {
      //   message: 'Token失效',
      //   type: 'error',
      // }
    } else {
      throw err;
    }
  });
};
export default errorHandle;
