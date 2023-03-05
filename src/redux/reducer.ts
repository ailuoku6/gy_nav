import { combineReducers } from "redux";
import { TYPE } from "./actions";
import initData from "../utils/data";
import { popularSite } from "../utils/data";

const User = (state = { user: null }, action: any) => {
  console.log("设置user", state.user, action.user);
  switch (action.type) {
    case TYPE.SET_USER:
      //if(action.user===state.user) return state;
      let user = action.user !== undefined ? action.user : state.user;
      console.log("下一个user", user);
      return { ...state, user: user };
    default:
      return { ...state };
  }
};

const Device = (state = { device: "pc" }, action: any) => {
  switch (action.type) {
    case TYPE.SET_DEVICE:
      return { ...state, device: action.device };
    default:
      return { ...state };
  }
};

const Show = (state = { marchine: false, sug: false }, action: any) => {
  switch (action.type) {
    case TYPE.SET_MARCHINE_SHOW:
      //if(action.show===state.marchine) return state;
      return { ...state, marchine: action.show };
    case TYPE.SET_SUG_SHOW:
      //if(action.show===state.sug) return state;
      return { ...state, sug: action.show };
    default:
      return { ...state };
  }
};

const MarchineIndex = (state = { index: 0 }, action: any) => {
  switch (action.type) {
    case TYPE.SET_MARCHINE_INDEX:
      return { ...state, index: action.index };
    default:
      return { ...state };
  }
};

const Partition = (state: { data: any } = { data: initData }, action: any) => {
  console.log("partData被修改", action, state);
  let data: any[] = [...state.data];
  switch (action.type) {
    case TYPE.ADD_PART2REAR:
      let newPart: { [key: string]: any } = {};
      newPart.categoryname = action.partName;
      newPart.sitelist = [];
      data.push(newPart);
      return { ...state, data: data };
    case TYPE.ADD_SITE2PART:
      let sitelist = [...data[action.partIndex].sitelist];
      sitelist.push({
        url: action.siteAddr,
        site_name: action.siteName,
      });
      data[action.partIndex].sitelist = sitelist;
      return { ...state, data: data };
    case TYPE.DEL_PART:
      data.splice(action.index, 1);
      return { ...state, data: data };
    case TYPE.DEL_SITE:
      console.log("删除站点", data, action);
      // data[action.partIndex].siteList.splice(action.siteIndex,1);
      let pSiteList = [...data[action.partIndex].sitelist];
      pSiteList.splice(action.siteIndex, 1);
      data[action.partIndex].sitelist = pSiteList;
      return { ...state, data: data };
    case TYPE.MODIFY_PART:
      data[action.partIndex].categoryname = action.partName;
      return { ...state, data: data };
    case TYPE.MODIFY_SITE:
      //data[action.partIndex].siteList[action.siteIndex] = action.site;
      let pSiteList__ = [...data[action.partIndex].sitelist];
      pSiteList__[action.siteIndex] = {
        url: action.siteAddr,
        site_name: action.siteName,
      };
      data[action.partIndex].sitelist = pSiteList__;
      return { ...state, data: data };
    case TYPE.SET_PARTITION:
      //state.data = action.partition;
      return { ...state, data: action.partition };
    case TYPE.MOVE_PART:
      let temp = data[action.oldPartIndex];
      data.splice(action.oldPartIndex, 1);
      data.splice(action.curPartIndex, 0, temp);
      return { ...state, data: data };
    case TYPE.MOVE_SITE:
      let pSiteList_ = [...data[action.partIndex].sitelist];
      let temp_ = pSiteList_[action.oldSiteIndex];
      pSiteList_.splice(action.oldSiteIndex, 1);
      pSiteList_.splice(action.curSiteIndex, 0, temp_);
      data[action.partIndex].sitelist = pSiteList_;
      return { ...state, data: data };
    case TYPE.INSERT_PART:
      data.splice(action.index, 0, action.part);
      return { ...state, data: data };
    default:
      return { ...state };
  }
};

const GlobalMsg = (state = { show: false, msg: "" }, action: any) => {
  switch (action.type) {
    case TYPE.SET_GLOBALMSG:
      return { ...state, show: action.show, msg: action.msg };
    default:
      return { ...state };
  }
};

const PopularSite = (state = { pSite: popularSite }, action: any) => {
  switch (action.type) {
    case TYPE.SET_POPULARSITE:
      return { ...state, pSite: action.pSite };
    default:
      return { ...state };
  }
};

export default combineReducers({
  User,
  Device,
  Show,
  MarchineIndex,
  Partition,
  GlobalMsg,
  PopularSite,
});
