export interface IUserData {
  id: string;
  userName: string;
  passWord?: string;
}

export enum DeviceTypes {
  pc = 'pc',
  phone = 'phone',
}

export interface ISite {
  site_name: string;
  url: string;
  id?: number;
}

export type PartSiteData = {
  categoryname: string;
  sitelist: ISite[];
};

export type PopularSite = ISite & {
  icon: string;
};

export enum TYPE {
  SET_USER = 'SET_USER',
  SET_DEVICE = 'SET_DEVICE',
  SET_MARCHINE_SHOW = 'SET_MARCHINE_SHOW',
  SET_SUG_SHOW = 'SET_SUG_SHOW',
  SET_MARCHINE_INDEX = 'SET_MARCHINE_INDEX',
  ADD_PART2REAR = 'ADD_PART2REAR',
  INSERT_PART = 'INSERT_PART',
  ADD_SITE2PART = 'ADD_SITE2PART',
  DEL_PART = 'DEL_PART',
  DEL_SITE = 'DEL_SITE',
  MODIFY_PART = 'MODIFY_PART',
  MODIFY_SITE = 'MODIFY_SITE',
  SET_PARTITION = 'SET_PARTITION',
  MOVE_PART = 'MOVE_PART',
  MOVE_SITE = 'MOVE_SITE',
  SET_GLOBALMSG = 'SET_GLOBALMSG',
  SET_POPULARSITE = 'SET_POPULARSITE',
}

export type IShowAction =
  | {
      type: TYPE.SET_MARCHINE_SHOW;
      show: boolean;
    }
  | {
      type: TYPE.SET_SUG_SHOW;
      show: boolean;
    };

export type IPartitionAction =
  | {
      type: TYPE.ADD_PART2REAR;
      partName: string;
    }
  | {
      type: TYPE.ADD_SITE2PART;
      partIndex: number;
      siteAddr: string;
      siteName: string;
    }
  | {
      type: TYPE.DEL_PART;
      index: number;
    }
  | {
      type: TYPE.DEL_SITE;
      partIndex: number;
      siteIndex: number;
    }
  | {
      type: TYPE.MODIFY_PART;
      partIndex: number;
      partName: string;
    }
  | {
      type: TYPE.MODIFY_SITE;
      partIndex: number;
      siteIndex: number;
      siteAddr: string;
      siteName: string;
    }
  | {
      type: TYPE.SET_PARTITION;
      partition?: PartSiteData[];
    }
  | {
      type: TYPE.MOVE_PART;
      oldPartIndex: number;
      curPartIndex: number;
    }
  | {
      type: TYPE.MOVE_SITE;
      partIndex: number;
      oldSiteIndex: number;
      curSiteIndex: number;
    }
  | {
      type: TYPE.INSERT_PART;
      index: number;
      part: PartSiteData;
    };
