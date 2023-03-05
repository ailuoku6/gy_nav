interface IAddCategory {}

interface IDelCategory {}

interface IUpdateCategory {}

interface IAddSite {}

interface IDelSite {}

interface IUpdateSite {}

interface IChangeOrder {}

export interface IWsEvents {
  addCategoryEvent: IAddCategory;
  delCategoryEvent: IDelCategory;
  updateCategoryEvent: IUpdateCategory;
  addSiteEvent: IAddSite;
  delSiteEvent: IDelSite;
  updateSiteEvent: IUpdateSite;
  changeOrderEvent: IChangeOrder;
}
