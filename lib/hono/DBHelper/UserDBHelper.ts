import { Ctx, IUser } from "../types";

export default class UserHelper {
  public static addUser = async (ctx: Ctx, user: IUser) => {
    // const exist_user = await User.findOne({
    //   where: {
    //     userName: user.userName,
    //   },
    // });

    // if (exist_user != null) {
    //   return { result: false, user: null, msg: "注册失败，用户已存在！" };
    // }

    // const rep = await User.create({
    //   userName: user.userName,
    //   passWord: user.passWord,
    //   partData: user.partData,
    // });

    // console.log(rep);

    // if (rep != null) {
    //   return { result: true, user: rep, msg: "注册成功" };
    // }

    // return { result: false, user: null, msg: "由于种种原因，注册失败了" };
  };

  public static findUser = async (
    ctx: Ctx,
    { userName, passWord }: { userName: string; passWord: string }
  ) => {
    // const user = await User.findOne({
    //   where: {
    //     userName: userName,
    //   },
    // });
    // if (user !== null && user.passWord === passWord) {
    //   //return user;
    //   return { result: true, user: user, msg: "登陆成功" };
    // }
    // return { result: false, user: null, msg: "账号或密码不正确，请重试" };
  };

  public static upPartData = async (
    ctx: Ctx,
    {
      userId,
      userName,
      passWord,
      partData,
    }: {
      userId: number;
      userName: string;
      passWord: string;
      partData: string;
    }
  ) => {
    // const user = await User.findOne({
    //   where: {
    //     id: userId,
    //   },
    // });
    // let res = { result: false, user: {}, msg: "认证错误" };
    // if (
    //   user !== null &&
    //   user.userName === userName &&
    //   user.passWord === passWord
    // ) {
    //   const updata = await User.update(
    //     { partData: partData },
    //     {
    //       where: {
    //         id: userId,
    //       },
    //     }
    //   );
    //   res.result = true;
    //   res.msg = "成功";
    //   res.user = updata;
    // }
    // return res;
  };
}
