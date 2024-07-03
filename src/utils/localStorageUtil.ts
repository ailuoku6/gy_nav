const SetlocalStorage = (key: string, value: any) => {
  console.log('保存至localStorage', key, value);
  if (typeof value !== 'string') {
    value = JSON.stringify(value);
  }
  console.log('保存至localStorage(parse)', key, value);
  window.localStorage.setItem(key, value);
};

const RemovelocalStorage = (key: string) => {
  window.localStorage.removeItem(key);
};

const GetlocalStorage = (key: string) => {
  const value = window.localStorage.getItem(key);
  console.log('读取localStorage', key, value);
  if (value === null || value === '') return null;
  try {
    const parseValue = JSON.parse(value);
    return parseValue;
  } catch (e) {
    console.log(e);
  }
  return value;
};

const SetMarchineIndexStore = (value: any) => {
  SetlocalStorage('searchEngine', value);
};

const GetMarchineIndexStore = () => {
  return GetlocalStorage('searchEngine');
};
/*
    {
        user:string
        password:string
    }
*/
const SetUserStore = (value: any) => {
  SetlocalStorage('userInfo', value);
};

const GetUserStore = () => {
  const userinfo: any = GetlocalStorage('userInfo');
  if (userinfo !== null) return userinfo;
  const userpre: any = GetlocalStorage('userpre'); //兼容旧数据
  if (userpre == null || typeof userpre != 'object') return null;
  return {
    userName: userpre.user ? userpre.user : '',
    passWord: userpre.password ? userpre.password : '',
  };
};

const SetTokenStore = (token: string) => {
  SetlocalStorage('token', token);
};

const GetTokenStore = () => {
  return GetlocalStorage('token');
};

const GetPartDataStore = () => {
  const partData = GetlocalStorage('partData');
  if (partData !== null) return partData;
  const siteData1 = GetlocalStorage('siteData1'); //兼容旧数据(什么鬼命名...)
  return siteData1;
};

const SetPartDataStore = (value: any) => {
  SetlocalStorage('partData', value);
};

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
  SetPartDataStore,
};
