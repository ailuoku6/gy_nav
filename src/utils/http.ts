/**axios封装
 * 请求拦截、相应拦截、错误统一处理
 */
import axios from 'axios';
import QS from 'qs';
import { BaseUrl } from './Api';
import { GetTokenStore, SetTokenStore } from './localStorageUtil';
import { history } from '../router/router';

const backToLogin = () => {
  history.replace('/login');
};

// const BaseUrl = "http://127.0.0.1:7001/";

// 环境的切换
// if (process.env.NODE_ENV == 'development') {
//     axios.defaults.baseURL = '/api';
// } else if (process.env.NODE_ENV == 'debug') {
//     axios.defaults.baseURL = '';
// } else if (process.env.NODE_ENV == 'production') {
//     axios.defaults.baseURL = 'http://api.123dailu.com/';
// }

axios.defaults.baseURL = '';

// 请求超时时间
axios.defaults.timeout = 3000;

// post请求头
axios.defaults.headers.post['Content-Type'] =
  'application/x-www-form-urlencoded;charset=UTF-8';

// 请求拦截器
axios.interceptors.request.use(
  (config) => {
    // 每次发送请求之前判断是否存在token，如果存在，则统一在http请求的header都加上token，不用每次请求都手动添加了
    // 即使本地存在token，也有可能token是过期的，所以在响应拦截器中要对返回状态进行判断
    // const token = store.state.token;
    // token && (config.headers.Authorization = token);
    // return config;
    const token = GetTokenStore();
    if (token) {
      // 判断是否存在token，如果存在的话，则每个http header都加上token
      // Bearer是JWT的认证头部信息
      config.headers.common['Authorization'] = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axios.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      console.log(response);
      const data = response.data;
      if (data.token) {
        SetTokenStore(data.token);
      }
      return Promise.resolve(response);
    } else {
      return Promise.reject(response);
    }
  },
  // 服务器状态码不是200的情况
  (error) => {
    // console.log("尝试跳转到登陆");
    if (error.response.status) {
      // console.log("尝试跳转到登陆");
      switch (error.response.status) {
        // 401: 未登录
        // 未登录则跳转登录页面，并携带当前页面的路径
        // 在登录成功后返回当前页面，这一步需要在登录页操作。
        case 401:
          backToLogin();
          SetTokenStore('');
          break;
        // 403 token过期
        // 登录过期对用户进行提示
        // 清除本地token和清空vuex中token对象
        // 跳转登录页面
        case 403:
          backToLogin();
          SetTokenStore('');
          break;
        // 404请求不存在
        case 404:
          // Toast({
          //     message: '网络请求不存在',
          //     duration: 1500,
          //     forbidClick: true
          // });
          break;
        // 其他错误，直接抛出错误提示
        default:
        // Toast({
        //     message: error.response.data.message,
        //     duration: 1500,
        //     forbidClick: true
        // });
      }
      return Promise.reject(error.response);
    }
  }
);
/**
 * get方法，对应get请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export function get(
  url: string,
  params: { [key: string]: any }
): Promise<{ result: boolean } & Record<string, any>> {
  console.log('发起请求');
  return new Promise((resolve, reject) => {
    axios
      .get(BaseUrl + url, {
        params: params,
      })
      .then((res) => {
        console.log('请求成功');
        resolve(res.data);
      })
      .catch((err) => {
        console.log('请求失败');
        reject(err.data);
      });
  });
}
/**
 * post方法，对应post请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export function post(
  url: string,
  params: { [key: string]: any }
): Promise<{ result: boolean; [key: string]: any }> {
  return new Promise((resolve, reject) => {
    axios
      .post(BaseUrl + url, QS.stringify(params))
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err.data);
      });
  });
}
