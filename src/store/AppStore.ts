import { ObservableClass } from 'kisstate';
import data from '../utils/data';
import { popularSite } from '../utils/data';
import {
  IUserData,
  DeviceTypes,
  PopularSite as IPopularSite,
  PartSiteData,
  ISite,
} from '../types';
import debounce from '../utils/debounce';
import { post } from '../utils/http';
import {
  UpPartData,
  UpPopularSites,
} from '../utils/Api';
import {
  SetMarchineIndexStore,
  SetUserStore,
  SetPartDataStore,
  SetPopularSiteStore,
} from '../utils/localStorageUtil';

type UpdateSource = 'user' | 'server' | 'local';

const getFaviconUrl = (url: string) => {
  try {
    const u = new URL(url);
    return `${u.origin}/favicon.ico`;
  } catch {
    return '';
  }
};

const debouncePost = debounce((data: PartSiteData[]) => {
  post(UpPartData, { partData: JSON.stringify(data) });
}, 1500);

const debounceStorePart = debounce((partData: PartSiteData[]) => {
  SetPartDataStore(partData);
}, 1000);

const debouncePostPopularSites = debounce((data: IPopularSite[]) => {
  post(UpPopularSites, { popularSites: JSON.stringify(data) });
}, 1500);

const debounceStorePopularSites = debounce((popularSites: IPopularSite[]) => {
  SetPopularSiteStore(popularSites);
}, 1000);

@ObservableClass
class AppStore {
  // User
  user: IUserData | null = null;

  // Device
  device: DeviceTypes = DeviceTypes.pc;

  // Show (marchine dropdown, suggestion dropdown)
  marchine = false;
  sug = false;

  // MarchineIndex (search engine index)
  marchineIndex = 0;

  // Partition (site categories)
  partitionData: PartSiteData[] = [...data];

  // GlobalMsg (snackbar)
  globalMsg = { show: false, msg: '' };

  // PopularSite
  pSite: IPopularSite[] = [...popularSite];

  // 用于区分数据更新来源，避免循环持久化（初始为 local 避免首次加载时持久化默认数据）
  _partitionUpdateSource: UpdateSource = 'local';
  _popularSiteUpdateSource: UpdateSource = 'local';

  constructor() {}

  // ========== User ==========
  setUser(user: IUserData | null, persist = true) {
    this.user = user;
    if (persist) {
      SetUserStore(user);
    }
  }

  // ========== Device ==========
  setDevice(device: DeviceTypes) {
    this.device = device;
  }

  // ========== Show ==========
  setMarchineShow(show: boolean) {
    this.marchine = show;
  }

  setSugShow(show: boolean) {
    this.sug = show;
  }

  // ========== MarchineIndex ==========
  setMarchineIndex(index: number, persist = true) {
    this.marchineIndex = index;
    if (persist) {
      SetMarchineIndexStore(index);
    }
  }

  // ========== GlobalMsg ==========
  setGlobalMsg(msg: string, show: boolean) {
    this.globalMsg = { msg, show };
  }

  // ========== Partition ==========
  private persistPartition() {
    const source = this._partitionUpdateSource;
    if (source === 'local') return;
    debounceStorePart(this.partitionData);
    if (source === 'user' && this.user) {
      debouncePost(this.partitionData);
    }
  }

  setPartition(partition: PartSiteData[], persistToLocal = true, syncToServer = true) {
    this._partitionUpdateSource = persistToLocal ? (syncToServer ? 'user' : 'server') : 'local';
    this.partitionData = [...partition];
    this.persistPartition();
  }

  addPart2Rear(partName: string) {
    this._partitionUpdateSource = 'user';
    const newPart: PartSiteData = {
      categoryname: partName,
      sitelist: [],
    };
    this.partitionData = [...this.partitionData, newPart];
    this.persistPartition();
  }

  addSite2Part(partIndex: number, siteName: string, siteAddr: string) {
    this._partitionUpdateSource = 'user';
    const newData = [...this.partitionData];
    const sitelist = [...newData[partIndex].sitelist, { site_name: siteName, url: siteAddr }];
    newData[partIndex] = { ...newData[partIndex], sitelist };
    this.partitionData = newData;
    this.persistPartition();
  }

  delPart(index: number) {
    this._partitionUpdateSource = 'user';
    const newData = [...this.partitionData];
    newData.splice(index, 1);
    this.partitionData = newData;
    this.persistPartition();
  }

  delSite(partIndex: number, siteIndex: number) {
    this._partitionUpdateSource = 'user';
    const newData = [...this.partitionData];
    const sitelist = [...newData[partIndex].sitelist];
    sitelist.splice(siteIndex, 1);
    newData[partIndex] = { ...newData[partIndex], sitelist };
    this.partitionData = newData;
    this.persistPartition();
  }

  modifyPart(partIndex: number, partName: string) {
    this._partitionUpdateSource = 'user';
    const newData = [...this.partitionData];
    newData[partIndex] = { ...newData[partIndex], categoryname: partName };
    this.partitionData = newData;
    this.persistPartition();
  }

  modifySite(partIndex: number, siteIndex: number, siteName: string, siteAddr: string) {
    this._partitionUpdateSource = 'user';
    const newData = [...this.partitionData];
    const sitelist = [...newData[partIndex].sitelist];
    sitelist[siteIndex] = { site_name: siteName, url: siteAddr };
    newData[partIndex] = { ...newData[partIndex], sitelist };
    this.partitionData = newData;
    this.persistPartition();
  }

  movePart(oldPartIndex: number, curPartIndex: number) {
    this._partitionUpdateSource = 'user';
    const newData = [...this.partitionData];
    const [temp] = newData.splice(oldPartIndex, 1);
    newData.splice(curPartIndex, 0, temp);
    this.partitionData = newData;
    this.persistPartition();
  }

  moveSite(partIndex: number, oldSiteIndex: number, curSiteIndex: number) {
    this._partitionUpdateSource = 'user';
    const newData = [...this.partitionData];
    const sitelist = [...newData[partIndex].sitelist];
    const [temp] = sitelist.splice(oldSiteIndex, 1);
    sitelist.splice(curSiteIndex, 0, temp);
    newData[partIndex] = { ...newData[partIndex], sitelist };
    this.partitionData = newData;
    this.persistPartition();
  }

  insertPart(index: number, part: PartSiteData) {
    this._partitionUpdateSource = 'user';
    const newData = [...this.partitionData];
    newData.splice(index, 0, part);
    this.partitionData = newData;
    this.persistPartition();
  }

  // ========== PopularSite ==========
  private persistPopularSite() {
    const source = this._popularSiteUpdateSource;
    if (source === 'local') return;
    debounceStorePopularSites(this.pSite);
    if (source === 'user' && this.user) {
      debouncePostPopularSites(this.pSite);
    }
  }

  setPopularSite(pSite: IPopularSite[], persistToLocal = true, syncToServer = true) {
    this._popularSiteUpdateSource = persistToLocal ? (syncToServer ? 'user' : 'server') : 'local';
    this.pSite = [...pSite];
    this.persistPopularSite();
  }

  addPopularSite(siteName: string, url: string, icon?: string) {
    this._popularSiteUpdateSource = 'user';
    const iconUrl =
      icon && String(icon).trim() ? icon : getFaviconUrl(url || '');
    const newSite: IPopularSite = {
      site_name: siteName,
      url: url,
      icon: iconUrl,
    };
    this.pSite = [...this.pSite, newSite];
    this.persistPopularSite();
  }

  delPopularSite(index: number) {
    this._popularSiteUpdateSource = 'user';
    const list = [...this.pSite];
    list.splice(index, 1);
    this.pSite = list;
    this.persistPopularSite();
  }

  modifyPopularSite(index: number, siteName: string, url: string, icon?: string) {
    this._popularSiteUpdateSource = 'user';
    const list = [...this.pSite];
    const iconUrl =
      icon && String(icon).trim()
        ? icon
        : getFaviconUrl(url || list[index]?.url || '');
    list[index] = {
      site_name: siteName,
      url: url,
      icon: iconUrl,
    };
    this.pSite = list;
    this.persistPopularSite();
  }

  movePopularSite(oldIndex: number, curIndex: number) {
    this._popularSiteUpdateSource = 'user';
    const list = [...this.pSite];
    const [item] = list.splice(oldIndex, 1);
    list.splice(curIndex, 0, item);
    this.pSite = list;
    this.persistPopularSite();
  }
}

export const appStore = new AppStore();
export { DeviceTypes };
export type { IUserData, PartSiteData, IPopularSite, ISite };
