import { useEffect } from 'react';
import './App.css';
//import './dark.css';
import Router from './router/router';
import { appStore } from './store/AppStore';
import { GetUserStore } from './utils/localStorageUtil';
// @ts-ignore
import React from 'react';

const App = () => {
  const initUser = () => {
    const newUser = GetUserStore();
    if (newUser !== null && newUser !== undefined) {
      console.log('从本地读取到了用户', newUser.userName);
      appStore.setUser(newUser);
    }
  };

  useEffect(() => {
    initUser();
  }, []);

  return <Router />;
};

export default App;
