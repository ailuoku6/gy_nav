import { Hono } from "hono";

import { jwt } from "hono/jwt";

import { Bindings } from "./types";
import errorHandle from "./middleware/errorHandle";

import UserService from "./service/userService";
import SiteService from "./service/siteService";
import FriendSiteService from "./service/friendSiteService";
import ClipboardService from "./service/clipboardService";

const app = new Hono<{ Bindings: Bindings }>();

const authFreeSet = new Set(["/api/login", "/api/signup", "/api/getAllFS"]);

app.use("/api/*", (c, next) => {
  if (authFreeSet.has(c.req.path)) {
    return next();
  }

  const jwtMiddleware = jwt({
    secret: c.env.TokenSecret || "GY",
  });
  return jwtMiddleware(c, next);
});

app.use(errorHandle);

app.post("/api/login", async (ctx) => {
  const body = await ctx.req.parseBody();
  // const { userName, passWord } = await ctx.req.json();
  const { userName, passWord } = body as any;

  // 检查是否提供了用户名和密码
  if (!userName || !passWord) {
    return ctx.json(
      { result: false, msg: "Username and password are required" },
      400
    );
  }

  return await UserService.login(ctx, { passWord, userName });
});

app.post("/api/signup", async (ctx) => {
  const body = await ctx.req.parseBody();
  // const { userName, passWord, partData } = await ctx.req.json();
  const { userName, passWord, partData } = body as any;

  // 检查是否提供了用户名和密码
  if (!userName || !passWord || !partData) {
    return ctx.json(
      { result: false, msg: "Username and passWord are required" },
      400
    );
  }
  return await UserService.signUp(ctx, { userName, passWord, partData });
});

app.post("/api/getPartData", async (ctx) => {
  return await SiteService.getPartData(ctx);
});

app.post("/api/upPartData", async (ctx) => {
  // const { partData } = await ctx.req.json();
  const body = await ctx.req.parseBody();
  const { partData } = body as any;

  // 检查是否提供了 partData
  if (!partData) {
    return ctx.json({ result: false, msg: "partData is required" });
  }

  return await SiteService.updatePartData(ctx, { partData });
});

app.post("/api/veriToken", async (ctx) => {
  return ctx.json({ result: true });
});

app.get("/api/getAllFS", async (ctx) => {
  return await FriendSiteService.getAllFSite(ctx);
});

app.post("/api/writeClipBoard", async (ctx) => {
  const [body] = await Promise.all([
    ctx.req.parseBody(),
  ]);
  const { clipboardString } = body as any;

  if (!clipboardString) {
    return ctx.json({ result: false, msg: "clipboardString is required" }, 400);
  }

  return await ClipboardService.writeClipBoard(ctx, { clipboardString });
});

app.post("/api/getClipBoard", async (ctx) => {
  return await ClipboardService.getClipBoard(ctx);
});

export default app;
