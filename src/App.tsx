import React, { useEffect } from "react";
import "./App.css";
import Router from "./router/router";
import { setUser } from "./redux/actions";
import { GetUserStore } from "./utils/localStorageUtil";
// import { connect } from "react-redux";

import { useDispatch } from "react-redux";

import useWebsocket from "hooks/useWebwocket";

export default function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    let user = GetUserStore();
    if (user !== null && user !== undefined) {
      console.log("从本地读取到了用户", user.userName);

      dispatch(setUser(user));
    }
  }, []);

  useWebsocket();

  return <Router />;
}
