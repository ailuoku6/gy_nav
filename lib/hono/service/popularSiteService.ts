import { Ctx } from '../types';

export default class PopularSiteService {
  public static getPopularSites = async (ctx: Ctx) => {
    try {
      const payloadJson = ctx.get('jwtPayload');
      const db = ctx.env.DB;
      const row = await db
        .prepare('SELECT popularSites FROM popularSites WHERE userId = ?')
        .bind(payloadJson.user.id)
        .first();

      return ctx.json({
        result: true,
        popularSites: row?.popularSites ?? '[]',
      });
    } catch (error: any) {
      return ctx.json({ result: false, msg: error.message }, 500);
    }
  };

  public static updatePopularSites = async (
    ctx: Ctx,
    { popularSites }: { popularSites: string }
  ) => {
    try {
      const payloadJson = ctx.get('jwtPayload');
      const db = ctx.env.DB;

      const result = await db
        .prepare(
          `INSERT INTO popularSites (userId, popularSites, modifyDate) 
           VALUES (?, ?, datetime('now'))
           ON CONFLICT(userId) DO UPDATE SET 
             popularSites = excluded.popularSites, 
             modifyDate = datetime('now')`
        )
        .bind(payloadJson.user.id, popularSites)
        .run();

      if (result.success) {
        return ctx.json({
          result: true,
          msg: 'popularSites updated successfully',
        });
      } else {
        return ctx.json({ result: false, msg: 'Failed to update popularSites' });
      }
    } catch (error: any) {
      return ctx.json({ result: false, msg: error.message }, 500);
    }
  };
}
