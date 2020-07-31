import debounce from '../../utils/debounce'
import {TYPE, setMarchineIndex} from '../actions'
import {UpPartData} from '../../utils/Api'
import { SetMarchineIndexStore,SetUserStore,SetPartDataStore } from '../../utils/localStorageUtil'
import {get,post} from "../../utils/http"


const debounceGet = debounce((data)=>{
    //get('http://www.baidu.com',data);
},1500);

const debouncePost = debounce((data)=>{
    post(UpPartData,{partData:JSON.stringify(data)})
},1500);

const debounceStorePart = debounce((partData)=>{//防止频繁写入
    SetPartDataStore(partData);
},1000)

const handlePart = store => next => action =>{
    // console.log('prev state',store.getState())
    console.log('dispatch',action);

    let result = next(action);

    //console.log('next state',store.getState());
    if(action.type.indexOf('PART')!=-1||action.type.indexOf('SITE')!=-1){
        console.log("修改分区时触发");
        debounceGet(store.getState().Partition.data);
        if(action.type===TYPE.SET_PARTITION){//
            if(action.isStore) debounceStorePart(store.getState().Partition.data);
            if(action.isUp&&(store.getState().User.user)) debouncePost(store.getState().Partition.data);
        }else{
            debounceStorePart(store.getState().Partition.data);
            if(store.getState().User.user){
                debouncePost(store.getState().Partition.data);
            }
        }
        
    }else if(action.type===TYPE.SET_MARCHINE_INDEX&&action.isStore){
        console.log("保存搜索引擎选择",store.getState().MarchineIndex.index);
        SetMarchineIndexStore(store.getState().MarchineIndex.index);
    } else if(action.type===TYPE.SET_USER&&action.isStore){
        let user = store.getState().User.user;
        SetUserStore(user);
    }

    return result;
}

export default handlePart;