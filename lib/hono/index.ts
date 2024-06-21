import { Hono } from "hono";

import { jwt, sign, decode, verify } from "hono/jwt";

import { Bindings } from "./types";
import errorHandle from "./middleware/errorHandle";

import encrypt, { encryptData, decryptData } from "./utils/encrypt";

const app = new Hono<{ Bindings: Bindings }>();

const signToken = (data: any, key: string) => {
  const time = Math.floor(new Date().getTime() / 1000);
  const expTime = time + 30 * 24 * 60 * 60;
  return sign({ ...data, exp: expTime, iat: time }, key);
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

app.post("/api/login", async (ctx) => {
  const tokenSecret = ctx.env.TokenSecret || "GY";

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

  try {
    const db = ctx.env.DB;
    const user = await db
      .prepare("SELECT * FROM users WHERE userName = ?")
      .bind(userName)
      .first();

    if (!user) {
      return ctx.json({ result: false, msg: "Invalid username or password" });
    }

    const valiPass = await encrypt(passWord);

    // 验证密码
    const isPasswordValid = valiPass === user.passWord;
    if (!isPasswordValid) {
      return ctx.json({ result: false, msg: "Invalid username or password" });
    }

    const userToken = {
      id: user.id,
      userName: user.userName,
      // passWord: user.passWord,
    };

    // 生成 JWT
    const token = await signToken({ user: userToken }, tokenSecret);

    return ctx.json({
      result: true,
      user: { id: user.id, userName: user.userName, partData: user.partData },
      msg: "Login successful",
      token,
    });
  } catch (error: any) {
    return ctx.json({ result: false, msg: error.message }, 500);
  }
});

app.post("/api/signup", async (ctx) => {
  try {
    const tokenSecret = ctx.env.TokenSecret || "GY";
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

    // 加密密码
    const hashedPassword = await encrypt(passWord);

    const db = ctx.env.DB;
    const result = await db
      .prepare(
        "INSERT INTO users (userName, passWord, partData) VALUES (?, ?, ?)"
      )
      .bind(
        userName,
        hashedPassword,
        typeof partData === "string" ? partData : JSON.stringify(partData)
      )
      .run();

    if (result.success) {
      // 获取新注册用户的ID
      const user = await db
        .prepare("SELECT id, userName, partData FROM users WHERE userName = ?")
        .bind(userName)
        .first();
      if (user) {
        const userToken = {
          id: user.id,
          userName: user.userName,
          // passWord: user.passWord,
        };
        const token = await signToken({ user: userToken }, tokenSecret);
        return ctx.json({ result: true, user, msg: "", token });
      } else {
        return ctx.json({ result: false, msg: "User registration failed" });
      }
    } else {
      return ctx.json({ result: false, msg: "User registration failed" });
    }
  } catch (error: any) {
    return ctx.json({ result: false, msg: error.message });
  }
});

app.post("/api/getPartData", async (ctx) => {
  try {
    const payloadJson = ctx.get("jwtPayload");
    // const payloadJson = JSON.parse(payload);
    const db = ctx.env.DB;
    const user = await db
      .prepare("SELECT partData FROM users WHERE id = ?")
      .bind(payloadJson.user.id)
      .first();

    if (!user) {
      return ctx.json({ result: false, msg: "User not found" });
    }

    return ctx.json({ result: true, partData: user.partData });
  } catch (error: any) {
    return ctx.json({ result: false, msg: error.message }, 500);
  }
});

app.post("/api/upPartData", async (ctx) => {
  // const { partData } = await ctx.req.json();
  const body = await ctx.req.parseBody();
  const { partData } = body as any;

  // 检查是否提供了 partData
  if (!partData) {
    return ctx.json({ result: false, msg: "partData is required" });
  }

  try {
    const payloadJson = ctx.get("jwtPayload");
    // const payloadJson = JSON.parse(payload);
    const db = ctx.env.DB;

    const result = await db
      .prepare(
        "UPDATE users SET partData = ?, partModifyDate = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .bind(partData, payloadJson.user.id)
      .run();

    if (result.success) {
      return ctx.json({ result: true, msg: "partData updated successfully" });
    } else {
      return ctx.json({ result: false, msg: "Failed to update partData" });
    }
  } catch (error: any) {
    return ctx.json({ result: false, msg: error.message }, 500);
  }
});

app.post("/api/veriToken", async (ctx) => {
  return ctx.json({ result: true });
});

app.get("/api/getAllFS", async (ctx) => {
  try {
    const db = ctx.env.DB;
    const sites = await db.prepare("SELECT * FROM friendSites").all();
    return ctx.json({ result: true, fsites: sites.results });
  } catch (error: any) {
    return ctx.json({ result: false, msg: error.message }, 500);
  }
});

app.post("/api/writeClipBoard", async (ctx) => {
  // const { clipboardString } = await ctx.req.json();
  const body = await ctx.req.parseBody();
  const { clipboardString } = body as any;

  if (!clipboardString) {
    return ctx.json({ result: false, msg: "clipboardString is required" }, 400);
  }

  try {
    const payloadJson = ctx.get("jwtPayload");
    // const payloadJson = JSON.parse(payload);
    const db = ctx.env.DB;

    const dataSecretKey = ctx.env.DataSecretKey || "GY";

    // 计算剪切板内容的过期时间 (当前时间加上 5 分钟)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const result = await db
      .prepare(
        "INSERT INTO clipboard (user_id, content, expires_at) VALUES (?, ?, ?)"
      )
      .bind(
        payloadJson.user.id,
        JSON.stringify(
          await encryptData(
            clipboardString,
            `${dataSecretKey}-${payloadJson.user.id}`
          )
        ),
        expiresAt
      )
      .run();

    if (result.success) {
      return ctx.json({
        result: true,
        msg: "Clipboard content write successfully",
      });
    } else {
      return ctx.json({
        result: false,
        msg: "Failed to write clipboard content",
      });
    }
  } catch (error: any) {
    return ctx.json({ result: false, msg: error.message }, 500);
  }
});

app.post("/api/getClipBoard", async (ctx) => {
  const dataSecretKey = ctx.env.DataSecretKey || "GY";

  try {
    const payloadJson = ctx.get("jwtPayload");
    // const payloadJson = JSON.parse(payload);
    const db = ctx.env.DB;

    const now = new Date().toISOString();
    const content = await db
      .prepare(
        "SELECT content FROM clipboard WHERE user_id = ? AND expires_at > ? ORDER BY updated_at DESC LIMIT 1"
      )
      .bind(payloadJson.user.id, now)
      .first();

    if (!content) {
      return ctx.json({
        result: false,
        data: "",
        msg: "No valid clipboard content found",
      });
    }

    const data = await decryptData(
      JSON.parse(content.content as string),
      `${dataSecretKey}-${payloadJson.user.id}`
    );

    return ctx.json({ result: true, data, msg: "success" });
  } catch (error: any) {
    return ctx.json({ result: false, msg: error.message }, 500);
  }
});

export default app;
