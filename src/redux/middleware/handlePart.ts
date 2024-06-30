
// @ts-ignore
import debounce from '../../utils/debounce';
// import { TYPE } from '../actions';
import { TYPE } from '../types';
// @ts-ignore
import { UpPartData } from '../../utils/Api';
import {
  SetMarchineIndexStore,
  SetUserStore,
  SetPartDataStore,
  // @ts-ignore
} from '../../utils/localStorageUtil';
// @ts-ignore
import { post } from '../../utils/http';
import { PartSiteData } from '../types';
import { AnyAction, Dispatch, MiddlewareAPI } from 'redux';

const debounceGet = debounce((_data: any) => {
  //get('http://www.baidu.com',data);
}, 1500);

const debouncePost = debounce((data: PartSiteData[]) => {
  post(UpPartData, { partData: JSON.stringify(data) });
}, 1500);

const debounceStorePart = debounce((partData: PartSiteData[]) => {
  //防止频繁写入
  SetPartDataStore(partData);
}, 1000);

const handlePart =
  (store: MiddlewareAPI<Dispatch, any>) =>
  (next: Dispatch<AnyAction>) =>
  (action: any) => {
    // console.log('prev state',store.getState())
    console.log('dispatch', action);

    const result = next(action);

    //console.log('next state',store.getState());
    if (
      action.type.indexOf('PART') !== -1 ||
      action.type.indexOf('SITE') !== -1
    ) {
      console.log('修改分区时触发');
      debounceGet(store.getState().Partition.data);
      if (action.type === TYPE.SET_PARTITION) {
        //
        if (action.isStore) debounceStorePart(store.getState().Partition.data);
        if (action.isUp && store.getState().User.user)
          debouncePost(store.getState().Partition.data);
      } else {
        debounceStorePart(store.getState().Partition.data);
        if (store.getState().User.user) {
          debouncePost(store.getState().Partition.data);
        }
      }
    } else if (action.type === TYPE.SET_MARCHINE_INDEX && action.isStore) {
      console.log('保存搜索引擎选择', store.getState().MarchineIndex.index);
      SetMarchineIndexStore(store.getState().MarchineIndex.index);
    } else if (action.type === TYPE.SET_USER && action.isStore) {
      const user = store.getState().User.user;
      SetUserStore(user);
    }

    return result;
  };

export default handlePart;
