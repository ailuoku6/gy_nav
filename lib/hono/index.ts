import { Hono } from "hono";

import { jwt } from "hono/jwt";

import { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();

app.use("/api/*", (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.TokenSecret || "",
  });
  return jwtMiddleware(c, next);
});

app.get("/api", (ctx) => ctx.text("Hello world, this is Hono!!"));
app.get("/api/users", async (ctx) => {
  let res = null;
  try {
    console.info("---------", ctx.env.DB);
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
