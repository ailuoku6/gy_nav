import { Dispatch } from "redux";

import { IWsEvents } from "./Types/WSEventType";

import { socketManager } from "./socket";

export class WsEvents {
  private static instance?: WsEvents;
  private dispatchFun?: Dispatch;
  // 未消费事件，当没有dispatch回调时，暂存到这里
  private eventsList: (() => void)[] = [];

  // 处理添加分区的协同事件
  private handleAddCategory(payload: IWsEvents["addCategoryEvent"]) {}

  // 处理删除分区得闲协同事件
  private handleDelCategory(payload: IWsEvents["delCategoryEvent"]) {}

  // 处理升级分区的协同事件
  private handleUpdateCategory(payload: IWsEvents["updateCategoryEvent"]) {}

  // 处理新建站点的协同事件
  private handleAddSite(payload: IWsEvents["addSiteEvent"]) {}

  // 处理删除站点的协同事件
  private handleDelSite(payload: IWsEvents["delSiteEvent"]) {}

  // 处理修改站点的协同事件
  private handleUpdateSite(payload: IWsEvents["updateSiteEvent"]) {}

  // 处理排序的协同事件
  private handleChangeOrder(payload: IWsEvents["changeOrderEvent"]) {}

  private constructor() {
    // 注册监听事件
    socketManager.onMsg("addCategoryEvent", this.handleAddCategory);
    socketManager.onMsg("delCategoryEvent", this.handleDelCategory);
    socketManager.onMsg("updateCategoryEvent", this.handleUpdateCategory);
    socketManager.onMsg("addSiteEvent", this.handleAddSite);
    socketManager.onMsg("delSiteEvent", this.handleDelSite);
    socketManager.onMsg("updateSiteEvent", this.handleUpdateSite);
    socketManager.onMsg("changeOrderEvent", this.handleChangeOrder);
  }

  public static getInstance() {
    if (!WsEvents.instance) {
      WsEvents.instance = new WsEvents();
    }
    return WsEvents.instance;
  }

  public bindDispatchFun(dispatch: Dispatch) {
    this.dispatchFun = dispatch;
  }
}
