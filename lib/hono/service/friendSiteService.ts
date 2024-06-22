import { Ctx, IFriendSite } from "../types";

export default class FriendSiteService {
  public static getAllFSite = async (ctx: Ctx) => {
    try {
      const db = ctx.env.DB;
      const sites = await db.prepare("SELECT * FROM friendSites").all();
      const fsites = sites.results || [];
      fsites.push({
        site_name: "友链申请",
        url: "http://mail.qq.com/cgi-bin/qm_share?t=qm_mailme&email=zK2loLmjp7n6jL294q_joQ",
      });

      return ctx.json({ result: true, fsites });
    } catch (error: any) {
      return ctx.json({ result: false, msg: error.message }, 500);
    }
  };
}
