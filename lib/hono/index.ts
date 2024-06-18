import { Hono } from "hono";
const app = new Hono();

app.get("/api", (ctx) => ctx.text("Hello world, this is Hono!!"));

export default app;