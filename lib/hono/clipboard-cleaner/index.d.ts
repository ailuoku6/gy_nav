import { Ctx } from '../types';

declare module 'index' {
  export async function scheduled(
    event: any,
    env: Ctx['env'],
    ctx: Ctx
  ): Promise<void>;
}
