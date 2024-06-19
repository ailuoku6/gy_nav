import { Ctx, IFriendSite } from "../types";

export default class FriendSiteHelper {
  public static GetAllFSite = async (ctx: Ctx) => {
    // const fsites = await FriendSite.findAll();
    const ps = ctx.env.DB.prepare("SELECT * from friendSites");
    const data = await ps.all();
    const fsites = data.results as unknown as IFriendSite[];
    let newfsite: IFriendSite = {
      site_name: "友链申请",
      url: "http://mail.qq.com/cgi-bin/qm_share?t=qm_mailme&email=zK2loLmjp7n6jL294q_joQ",
    };

    // newfsite.site_name = "友链申请";
    // newfsite.url =
    //   "http://mail.qq.com/cgi-bin/qm_share?t=qm_mailme&email=zK2loLmjp7n6jL294q_joQ";
    // fsites.push({
    //     id:1000,site_name:"友链申请",
    //     url:"http://mail.qq.com/cgi-bin/qm_share?t=qm_mailme&email=zK2loLmjp7n6jL294q_joQ",
    //     createdAt:new Date(),updatedAt:new Date()
    // })
    fsites.push(newfsite);
    return { result: true, fsites: fsites };
  };

  //   public static addFSite = async (ctx: Ctx, fs: IFriendSite) => {
  //     const exist_site = await FriendSite.findOne({
  //       where: {
  //         site_name: fs.site_name,
  //       },
  //     });
  //     if (exist_site !== null) {
  //       return { result: false, fsite: null, msg: "添加失败" };
  //     }

  //     const rep = await FriendSite.create(fs);

  //     return { result: true, fsite: rep, msg: "添加成功" };
  //   };

  // public static upFsiteData = async (siteId:number,site_name:string,url:string)=>{

  //     const fsite = await FriendSite.update({site_name:site_name,url:url},{
  //         where:{
  //             id:siteId
  //         }
  //     })

  //     return {result:true,fsite,msg:"修改成功"}
  // }
}
