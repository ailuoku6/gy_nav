export const TYPE = {
  SET_USER: 'SET_USER',
  SET_DEVICE: 'SET_DEVICE',
  SET_MARCHINE_SHOW: 'SET_MARCHINE_SHOW',
  SET_SUG_SHOW: 'SET_SUG_SHOW',
  SET_MARCHINE_INDEX: 'SET_MARCHINE_INDEX',
  ADD_PART2REAR: 'ADD_PART2REAR',
  INSERT_PART: 'INSERT_PART',
  ADD_SITE2PART: 'ADD_SITE2PART',
  DEL_PART: 'DEL_PART',
  DEL_SITE: 'DEL_SITE',
  MODIFY_PART: 'MODIFY_PART',
  MODIFY_SITE: 'MODIFY_SITE',
  SET_PARTITION: 'SET_PARTITION',
  MOVE_PART: 'MOVE_PART',
  MOVE_SITE: 'MOVE_SITE',
  SET_GLOBALMSG: 'SET_GLOBALMSG',
  SET_POPULARSITE: 'SET_POPULARSITE',
};

export const setUser = (user, isStore = true) => ({
  type: TYPE.SET_USER,
  user,
  isStore,
});

export const setDevice = (device) => ({
  type: TYPE.SET_DEVICE,
  device,
});
export const setMarchineShow = (show) => ({
  type: TYPE.SET_MARCHINE_SHOW,
  show,
});
export const setSugShow = (show) => ({
  type: TYPE.SET_SUG_SHOW,
  show,
});
export const setMarchineIndex = (index, isStore = true) => ({
  type: TYPE.SET_MARCHINE_INDEX,
  index,
  isStore,
});

export const setPartition = (partition, isStore = true, isUp = true) => ({
  type: TYPE.SET_PARTITION,
  partition,
  isStore,
  isUp,
});

export const addPart2Rear = (partName) => ({
  type: TYPE.ADD_PART2REAR,
  partName,
});

export const addSite2Part = (partIndex, siteName, siteAddr) => ({
  type: TYPE.ADD_SITE2PART,
  partIndex,
  siteName,
  siteAddr,
});

export const delPart = (index) => ({
  type: TYPE.DEL_PART,
  index,
});

export const delSite = (partIndex, siteIndex) => ({
  type: TYPE.DEL_SITE,
  partIndex,
  siteIndex,
});

export const modifyPart = (partIndex, partName) => ({
  type: TYPE.MODIFY_PART,
  partIndex,
  partName,
});

export const modifySite = (partIndex, siteIndex, siteName, siteAddr) => ({
  type: TYPE.MODIFY_SITE,
  partIndex,
  siteIndex,
  siteName,
  siteAddr,
});

export const movePart = (oldPartIndex, curPartIndex) => ({
  type: TYPE.MOVE_PART,
  oldPartIndex,
  curPartIndex,
});

export const moveSite = (partIndex, oldSiteIndex, curSiteIndex) => ({
  type: TYPE.MOVE_SITE,
  partIndex,
  oldSiteIndex,
  curSiteIndex,
});

export const insertPart = (index, part) => ({
  type: TYPE.INSERT_PART,
  index,
  part,
});

export const setGlobalMsg = (msg, show) => ({
  type: TYPE.SET_GLOBALMSG,
  msg,
  show,
});

export const setPopularSite = (pSite) => ({
  type: TYPE.SET_POPULARSITE,
  pSite,
});
