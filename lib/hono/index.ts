import { Hono } from "hono";
const app = new Hono();

app.get("/api", (ctx) => ctx.text("Hello world, this is Hono!!"));
app.get("/api/users", (ctx) => ctx.text("Hello users!!"));

export default app;