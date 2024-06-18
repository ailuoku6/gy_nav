import { Hono } from "hono";

type Bindings = {
//   MY_KV: KVNamespace;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/api", (ctx) => ctx.text("Hello world, this is Hono!!"));
app.get("/api/users", async (ctx) => {
  const ps = ctx.env.DB.prepare("SELECT * from users");
  const data = await ps.all();
  
  ctx.text("Hello users!!",JSON.stringify(data.results.map(item=>item as any)) as any);
});

export default app;
