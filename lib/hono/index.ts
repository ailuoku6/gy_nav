import { Hono } from "hono";

type Bindings = {
  //   MY_KV: KVNamespace;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

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
  ctx.text(`Hello users!!,${res}`);
});

export default app;
