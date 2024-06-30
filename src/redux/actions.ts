import {
  TYPE,
  IUserData,
  DeviceTypes,
  PartSiteData,
  PopularSite,
} from './types';

export const setUser = (user: IUserData, isStore = true) => ({
  type: TYPE.SET_USER,
  user,
  isStore,
});

export const setDevice = (device: DeviceTypes) => ({
  type: TYPE.SET_DEVICE,
  device,
});
export const setMarchineShow = (show: boolean) => ({
  type: TYPE.SET_MARCHINE_SHOW,
  show,
});
export const setSugShow = (show: boolean) => ({
  type: TYPE.SET_SUG_SHOW,
  show,
});
export const setMarchineIndex = (index: number, isStore = true) => ({
  type: TYPE.SET_MARCHINE_INDEX,
  index,
  isStore,
});

export const setPartition = (
  partition: PartSiteData[],
  isStore = true,
  isUp = true
) => ({
  type: TYPE.SET_PARTITION,
  partition,
  isStore,
  isUp,
});

export const addPart2Rear = (partName: string) => ({
  type: TYPE.ADD_PART2REAR,
  partName,
});

export const addSite2Part = (
  partIndex: number,
  siteName: string,
  siteAddr: string
) => ({
  type: TYPE.ADD_SITE2PART,
  partIndex,
  siteName,
  siteAddr,
});

export const delPart = (index: number) => ({
  type: TYPE.DEL_PART,
  index,
});

export const delSite = (partIndex: number, siteIndex: number) => ({
  type: TYPE.DEL_SITE,
  partIndex,
  siteIndex,
});

export const modifyPart = (partIndex: number, partName: string) => ({
  type: TYPE.MODIFY_PART,
  partIndex,
  partName,
});

export const modifySite = (
  partIndex: number,
  siteIndex: number,
  siteName: string,
  siteAddr: string
) => ({
  type: TYPE.MODIFY_SITE,
  partIndex,
  siteIndex,
  siteName,
  siteAddr,
});

export const movePart = (oldPartIndex: number, curPartIndex: number) => ({
  type: TYPE.MOVE_PART,
  oldPartIndex,
  curPartIndex,
});

export const moveSite = (
  partIndex: number,
  oldSiteIndex: number,
  curSiteIndex: number
) => ({
  type: TYPE.MOVE_SITE,
  partIndex,
  oldSiteIndex,
  curSiteIndex,
});

export const insertPart = (index: number, part: PartSiteData) => ({
  type: TYPE.INSERT_PART,
  index,
  part,
});

export const setGlobalMsg = (msg: string, show: boolean) => ({
  type: TYPE.SET_GLOBALMSG,
  msg,
  show,
});

export const setPopularSite = (pSite: PopularSite[]) => ({
  type: TYPE.SET_POPULARSITE,
  pSite,
});
