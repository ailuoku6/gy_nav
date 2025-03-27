import { useEffect } from 'react';
import './App.css';
//import './dark.css';
import Router from './router/router';
import { setUser } from './redux/actions';

import { GetUserStore } from './utils/localStorageUtil';

import { useDispatch } from 'react-redux';
// @ts-ignore
import React from 'react';

const App = () => {
  const dispatch = useDispatch();

  const initUser = () => {
    const newUser = GetUserStore();
    if (newUser !== null && newUser !== undefined) {
      console.log('从本地读取到了用户', newUser.userName);
      dispatch(setUser(newUser));
    }
  };

  useEffect(() => {
    initUser();
  }, []);

  return <Router />;
};

export default App;
