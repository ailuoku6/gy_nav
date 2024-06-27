import { Ctx } from "../types";

export default class SiteService {
  public static getPartData = async (ctx: Ctx) => {
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
  };
  public static updatePartData = async (
    ctx: Ctx,
    { partData }: { partData: string }
  ) => {
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
  };
}
