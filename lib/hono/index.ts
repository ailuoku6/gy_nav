import { Hono } from "hono";

import { jwt, sign as sign1, decode,verify } from "hono/jwt";

import { Bindings } from "./types";
import errorHandle from "./middleware/errorHandle";

const app = new Hono<{ Bindings: Bindings }>();

const signToen = (data: any, key: string) => {
  const time = Math.floor(new Date().getTime() / 1000);
  const expTime = time + 30 * 24 * 60 * 60;
  return sign1({ ...data, exp: expTime, iat: time },key);
};

const authFreeSet = new Set([
  "/api/auth_free",
  "/api/login",
  "/api/signup",
  "/api/getAllFS",
]);

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

app.get("/api", (ctx) => ctx.text("Hello world, this is Hono!!"));
app.get("/api/auth_free", (ctx) => ctx.text("Hello world, auth_free"));
app.get("/api/login", async (ctx) => {

  const tokenSecret = ctx.env.TokenSecret || "GY";

  const res2 = await signToen(
    { key: 1, user:{name:'abdc'} },
    tokenSecret
  );
  console.info("-------decodeData22", await verify(res2,tokenSecret));
  return ctx.text(`-----${res2}`);
});
app.get("/api/users", async (ctx) => {
  let res = null;

  const jwtPayload = ctx.get("jwtPayload");
  const jwtPayloadJson = ctx.json(jwtPayload);

  console.info("-------jwtPayloadJson", jwtPayloadJson);

  try {
    const ps = ctx.env.DB.prepare("SELECT * from users");
    const data = await ps.all();
    res = JSON.stringify(data.results);
  } catch (error) {
    res = JSON.stringify(error);
  }
  return ctx.text(
    `Hello users!!,${res},${ctx.env.DataSecretKey},${ctx.env.PasswordSecret}`
  );
});

export default app;
