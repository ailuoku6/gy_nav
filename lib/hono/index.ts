import { Hono } from 'hono';

import { jwt } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';

import { Bindings } from './types';
import errorHandle from './middleware/errorHandle';

import UserService from './service/userService';
import SiteService from './service/siteService';
import PopularSiteService from './service/popularSiteService';
import FriendSiteService from './service/friendSiteService';
import ClipboardService from './service/clipboardService';
import SiteHealthService from './service/siteHealthService';
import PasskeyService from './service/passkeyService';
import RtcService from './service/rtcService';

const app = new Hono<{ Bindings: Bindings }>();

const authFreeSet = new Set([
  '/api/login',
  '/api/signup',
  '/api/getAllFS',
  '/api/passkey/login/options',
  '/api/passkey/login/verify',
]);

app.use('/api/*', (c, next) => {
  if (c.req.path.startsWith('/api/rtc/')) return next();
  if (authFreeSet.has(c.req.path)) {
    return next();
  }

  const jwtMiddleware = jwt({
    secret: c.env.TokenSecret,
  });
  return jwtMiddleware(c, next);
});

app.use('/api/rtc/*', async (c, next) => {
  c.header('Cache-Control', 'no-store');
  c.header('X-Content-Type-Options', 'nosniff');
  const origin = c.req.header('Origin');
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ result: false, msg: '不允许跨站请求' }, 403);
  await next();
});

// Hono catches route errors inside compose; a surrounding middleware catch
// does not receive those errors. Keep RTC failures in the JSON API contract.
app.onError((error, c) => {
  if (c.req.path.startsWith('/api/rtc/')) {
    const status = error instanceof HTTPException ? error.status : 503;
    return c.json({ result: false, msg: status < 500 ? error.message : '信令服务不可用，请确认 D1 已执行 rtc.sql' }, status);
  }
  if (error instanceof HTTPException) return error.getResponse();
  return c.text('Internal Server Error', 500);
});

app.use(errorHandle);

app.post('/api/login', async (ctx) => {
  const body = await ctx.req.parseBody();
  const { userName, passWord } = body as any;

  // 检查是否提供了用户名和密码
  if (!userName || !passWord) {
    return ctx.json(
      { result: false, msg: 'Username and password are required' },
      400
    );
  }

  return await UserService.login(ctx, { passWord, userName });
});

app.post('/api/signup', async (ctx) => {
  const body = await ctx.req.parseBody();
  const { userName, passWord, partData } = body as any;

  // 检查是否提供了用户名和密码
  if (!userName || !passWord || !partData) {
    return ctx.json(
      { result: false, msg: 'Username and passWord are required' },
      400
    );
  }
  return await UserService.signUp(ctx, { userName, passWord, partData });
});

app.post('/api/getPartData', async (ctx) => {
  return await SiteService.getPartData(ctx);
});

app.post('/api/upPartData', async (ctx) => {
  const body = await ctx.req.parseBody();
  const { partData } = body as any;

  // 检查是否提供了 partData
  if (!partData) {
    return ctx.json({ result: false, msg: 'partData is required' });
  }

  return await SiteService.updatePartData(ctx, { partData });
});

app.post('/api/getPopularSites', async (ctx) => {
  return await PopularSiteService.getPopularSites(ctx);
});

app.post('/api/upPopularSites', async (ctx) => {
  const body = await ctx.req.parseBody();
  const { popularSites } = body as any;

  if (!popularSites) {
    return ctx.json({ result: false, msg: 'popularSites is required' });
  }

  return await PopularSiteService.updatePopularSites(ctx, { popularSites });
});

app.post('/api/veriToken', async (ctx) => {
  return ctx.json({ result: true });
});

app.post('/api/passkey/register/options', async (ctx) => {
  return await PasskeyService.createRegistrationOptions(ctx);
});

app.post('/api/passkey/register/verify', async (ctx) => {
  const body = await ctx.req.json();
  return await PasskeyService.verifyRegistration(ctx, body);
});

app.post('/api/passkey/login/options', async (ctx) => {
  const body = await ctx.req.json().catch(() => ({}));
  return await PasskeyService.createLoginOptions(ctx, body);
});

app.post('/api/passkey/login/verify', async (ctx) => {
  const body = await ctx.req.json();
  return await PasskeyService.verifyLogin(ctx, body);
});

app.get('/api/passkey/credentials', async (ctx) => {
  return await PasskeyService.listCredentials(ctx);
});

app.post('/api/passkey/credentials/delete', async (ctx) => {
  const body = await ctx.req.json();
  return await PasskeyService.deleteCredential(ctx, body);
});

app.get('/api/getAllFS', async (ctx) => {
  return await FriendSiteService.getAllFSite(ctx);
});

app.post('/api/writeClipBoard', async (ctx) => {
  const [body] = await Promise.all([ctx.req.parseBody()]);
  const { clipboardString } = body as any;

  if (!clipboardString) {
    return ctx.json({ result: false, msg: 'clipboardString is required' }, 400);
  }

  return await ClipboardService.writeClipBoard(ctx, { clipboardString });
});

app.post('/api/getClipBoard', async (ctx) => {
  return await ClipboardService.getClipBoard(ctx);
});

app.post('/api/checkSiteHealth', async (ctx) => {
  return await SiteHealthService.checkSiteHealth(ctx);
});

app.post('/api/rtc/rooms', async (ctx, next) => jwt({ secret: ctx.env.TokenSecret })(ctx, next), async (ctx) => RtcService.create(ctx));
app.post('/api/rtc/rooms/join', async (ctx) => RtcService.join(ctx));
app.get('/api/rtc/rooms/:roomId/events', async (ctx) => RtcService.events(ctx));
app.post('/api/rtc/rooms/:roomId/events', async (ctx) => RtcService.events(ctx));
app.post('/api/rtc/rooms/:roomId/heartbeat', async (ctx) => RtcService.heartbeat(ctx));
app.post('/api/rtc/rooms/:roomId/close', async (ctx) => RtcService.close(ctx));
app.post('/api/rtc/rooms/:roomId/ice-config', async (ctx) => RtcService.ice(ctx));

export default app;
