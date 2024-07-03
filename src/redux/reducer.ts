/* eslint-disable no-case-declarations */
import { combineReducers } from 'redux';
// import { TYPE } from './actions';
import data from '../utils/data';
import { popularSite } from '../utils/data';

import {
  IUserData,
  DeviceTypes,
  PopularSite as IPopularSite,
  PartSiteData,
  TYPE,
  IShowAction,
  IPartitionAction,
} from './types';

const User = (
  state: { user: IUserData | null | undefined } = { user: null },
  action: { type: string; user: IUserData | null | undefined }
) => {
  console.log('设置user', state.user, action.user);
  switch (action.type) {
    case TYPE.SET_USER:
      //if(action.user===state.user) return state;
      const user = action.user !== undefined ? action.user : state.user;
      console.log('下一个user', action, user);
      return { ...state, user: user };
    default:
      return { ...state };
  }
};

const Device = (
  state: { device: DeviceTypes } = { device: DeviceTypes.pc },
  action: { type: string; device: DeviceTypes }
) => {
  switch (action.type) {
    case TYPE.SET_DEVICE:
      return { ...state, device: action.device };
    default:
      return { ...state };
  }
};

const Show = (
  state: { marchine: boolean; sug: boolean } = { marchine: false, sug: false },
  action: IShowAction
) => {
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

const MarchineIndex = (
  state: { index: number } = { index: 0 },
  action: { type: string; index: number }
) => {
  switch (action.type) {
    case TYPE.SET_MARCHINE_INDEX:
      return { ...state, index: action.index };
    default:
      return { ...state };
  }
};

const Partition = (
  state: { data: PartSiteData[] } = { data: data },
  action: IPartitionAction
): { data: PartSiteData[] } => {
  console.log('partData被修改', action, state);
  const data = [...state.data];
  switch (action.type) {
    case TYPE.ADD_PART2REAR:
      const newPart: Partial<PartSiteData> = {};
      newPart.categoryname = action.partName;
      newPart.sitelist = [];
      data.push(newPart as PartSiteData);
      return { ...state, data: data };
    case TYPE.ADD_SITE2PART:
      const sitelist = [...data[action.partIndex || 0].sitelist];
      sitelist.push({
        url: action.siteAddr || '',
        site_name: action.siteName || '',
      });
      data[action.partIndex || 0].sitelist = sitelist;
      return { ...state, data: data };
    case TYPE.DEL_PART:
      data.splice(action.index || 0, 1);
      return { ...state, data: data };
    case TYPE.DEL_SITE:
      console.log('删除站点', data, action);
      // data[action.partIndex].siteList.splice(action.siteIndex,1);
      const pSiteList = [...data[action.partIndex || 0].sitelist];
      pSiteList.splice(action.siteIndex || 0, 1);
      data[action.partIndex || 0].sitelist = pSiteList;
      return { ...state, data: data };
    case TYPE.MODIFY_PART:
      data[action.partIndex || 0].categoryname = action.partName || '';
      return { ...state, data: data };
    case TYPE.MODIFY_SITE:
      //data[action.partIndex].siteList[action.siteIndex] = action.site;
      const pSiteList__ = [...data[action.partIndex || 0].sitelist];
      pSiteList__[action.siteIndex || 0] = {
        url: action.siteAddr || '',
        site_name: action.siteName || '',
      };
      data[action.partIndex || 0].sitelist = pSiteList__;
      return { ...state, data: data };
    case TYPE.SET_PARTITION:
      //state.data = action.partition;
      return { ...state, data: action.partition || [] };
    case TYPE.MOVE_PART:
      const temp = data[action.oldPartIndex];
      data.splice(action.oldPartIndex, 1);
      data.splice(action.curPartIndex, 0, temp);
      return { ...state, data: data };
    case TYPE.MOVE_SITE:
      const pSiteList_ = [...data[action.partIndex].sitelist];
      const temp_ = pSiteList_[action.oldSiteIndex];
      pSiteList_.splice(action.oldSiteIndex, 1);
      pSiteList_.splice(action.curSiteIndex, 0, temp_);
      data[action.partIndex || 0].sitelist = pSiteList_;
      return { ...state, data: data };
    case TYPE.INSERT_PART:
      data.splice(action.index || 0, 0, action.part);
      return { ...state, data: data };
    default:
      return { ...state };
  }
};

const GlobalMsg = (
  state: { show: boolean; msg: string } = { show: false, msg: '' },
  action: { type: string; show: boolean; msg: string }
) => {
  switch (action.type) {
    case TYPE.SET_GLOBALMSG:
      return { ...state, show: action.show, msg: action.msg };
    default:
      return { ...state };
  }
};

const PopularSite = (
  state: { pSite: IPopularSite[] } = { pSite: popularSite },
  action: { type: string; pSite: IPopularSite[] }
) => {
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
