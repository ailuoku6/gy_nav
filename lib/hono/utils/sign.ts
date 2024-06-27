import { sign } from 'hono/jwt';

export const signToken = (data: any, key: string) => {
  const time = Math.floor(new Date().getTime() / 1000);
  const expTime = time + 30 * 24 * 60 * 60;
  return sign({ ...data, exp: expTime, iat: time }, key);
};
