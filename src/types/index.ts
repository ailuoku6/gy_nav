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
