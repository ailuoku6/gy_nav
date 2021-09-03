const SetlocalStorage = (key,value)=>{
    console.log("保存至localStorage",key,value);
    if ((typeof value)!=='string'){
        value = JSON.stringify(value)
    }
    console.log("保存至localStorage(parse)",key,value);
    window.localStorage.setItem(key,value)
};

const RemovelocalStorage = (key)=>{
    window.localStorage.removeItem(key);
};

const GetlocalStorage = (key)=>{
    let value = window.localStorage.getItem(key);
    console.log("读取localStorage",key,value);
    if (value===null||value==='') return null;
    try {
        value = JSON.parse(value)
    }catch (e) {
        console.log(e)
    }
    return value;
};

const SetMarchineIndexStore = (value)=>{
    SetlocalStorage('searchEngine',value);
}

const GetMarchineIndexStore = ()=>{
    return GetlocalStorage('searchEngine');
}
/*
    {
        user:string
        password:string
    }
*/
const SetUserStore = (value)=>{
    SetlocalStorage('userInfo',value);
}

const GetUserStore = ()=>{
    let userinfo = GetlocalStorage('userInfo');
    if(userinfo!==null) return userinfo;
    let userpre = GetlocalStorage('userpre');//兼容旧数据
    if(userpre==null||typeof userpre!="object") return null;
    return {
        userName:userpre.user?userpre.user:'',
        passWord:userpre.password?userpre.password:''
    }
}

const SetTokenStore = (token)=>{
    SetlocalStorage("token",token)
}

const GetTokenStore = ()=>{
    return GetlocalStorage("token");
}

const GetPartDataStore = ()=>{
    let partData = GetlocalStorage("partData");
    if(partData!==null) return partData;
    let siteData1 = GetlocalStorage("siteData1");//兼容旧数据(什么鬼命名...)
    return siteData1;
}

const SetPartDataStore = (value)=>{
    SetlocalStorage('partData',value);
}

export {
    SetlocalStorage,
    RemovelocalStorage,
    GetlocalStorage,
    SetMarchineIndexStore,
    GetMarchineIndexStore,
    SetUserStore,
    GetUserStore,
    SetTokenStore,
    GetTokenStore,
    GetPartDataStore,
    SetPartDataStore
}
