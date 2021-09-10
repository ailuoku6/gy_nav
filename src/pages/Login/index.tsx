import React, { useState, useRef } from "react";
// import LoginRegister from 'react-mui-login-register';
import { useSelector, useDispatch } from "react-redux";
import {
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Button,
  Avatar,
} from "@material-ui/core";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import TextField from "@material-ui/core/TextField";
import { post } from "../../utils/http";
import { Signin, SignUp } from "../../utils/Api";
import { setDevice, setUser, setPartition } from "./../../redux/actions";
import { pswPattern } from "../../utils/veriLink";
import { Link } from "react-router-dom";
import "./index.css";
import { UILoginWrap, UITipText } from "./style";

import {
  SetUserStore,
  GetTokenStore,
  SetTokenStore,
  GetUserStore,
} from "../../utils/localStorageUtil";
import { history } from "../../router/router";
import { useEffect } from "react";

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

export default function Login(props: any) {
  const { device, user, Partition } = useSelector((state: any) => ({
    device: state.Device.device,
    user: state.User.user,
    Partition: state.Partition.data,
  }));
  const dispatch = useDispatch();

  const localUser = useRef<any>(null);

  // const [localUser, setLocalUSer] = useState<any>(null);

  const [index, setIndex] = useState<number>(0);

  const [userName, setUserName] = useState<string>("");

  const [passWord, setPassWord] = useState<string>("");

  const [passWord1, setPassWord1] = useState<string>("");

  const [tipText, setTipText] = useState<string>("");

  const [validToken, setValidToken] = useState<any>("");

  const initUser = () => {
    let user: any = GetUserStore();
    if (user !== null && user !== undefined) {
      console.log("从本地读取到了用户", user.userName);
      //   setUser(user);
      // setLocalUSer(user);
      localUser.current = user;
    }
  };

  const handleChange = (event: any, newValue: number) => {
    setIndex(newValue);
    setTipText("");
  };

  const handleSignin = () => {
    if (!userName || !passWord) return;
    let data: any = {};
    //userName,passWord
    data.userName = userName;
    data.passWord = passWord;
    post(Signin, data)
      .then((data: any) => {
        console.log(data);
        if (data.result === false) {
          setTipText(data.msg);
          return;
        }

        let user = data.user;
        let partData = user.partData;
        delete user.partData;
        user.passWord = passWord;

        dispatch(setPartition(JSON.parse(partData), true, false));
        dispatch(setUser(user));
        localUser.current = user;

        history.replace("/");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleSignup = () => {
    if (passWord.length < 6 || pswPattern.test(passWord)) {
      setTipText("密码不能少于6位，且不能含有中文");
      return;
    }
    if (passWord !== passWord1) {
      setTipText("两次输入的密码不一致");
      return;
    }

    let data: any = {};
    //userName,passWord
    data.userName = userName;
    data.passWord = passWord;
    data.partData = JSON.stringify(Partition);
    post(SignUp, data)
      .then((data: any) => {
        console.log(data);
        if (data.result === false) {
          //   this.setState({
          //     tipText: data.msg,
          //   });
          setTipText(data.msg);
          return;
        }

        let user = data.user;
        let partData = user.partData;
        delete user.partData;
        user.passWord = passWord;

        dispatch(setPartition(JSON.parse(partData), true, false));
        dispatch(setUser(user));
        localUser.current = user;
        history.replace("/");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    document.title = "注册/登陆";
    console.log("读取配置", user);
    initUser();
    if (localUser.current !== null) {
      setUserName(localUser.current.userName);
      setPassWord(localUser.current.passWord);
    }
    let token = GetTokenStore();
    if (token) {
      setValidToken(true);
    }
  }, []);

  const renderUserWelcome = () => {
    return (
      <div>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="title" color="inherit">
              {"欢迎你， " + localUser.current.userName}
            </Typography>
          </Toolbar>
        </AppBar>
        <div style={{ padding: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 10,
            }}
          >
            <Avatar>{localUser.current.userName[0]}</Avatar>
          </div>

          <Link to={"/"}>
            <Button
              variant="contained"
              color="secondary"
              style={{ width: "100%" }}
            >
              返回
            </Button>
          </Link>
          <Button
            variant="contained"
            style={{ width: "100%", marginTop: 10 }}
            onClick={() => {
              SetTokenStore("");
              SetUserStore("");
              dispatch(setUser(null));
            }}
          >
            登出
          </Button>
        </div>
      </div>
    );
  };

  const renderLogin = () => {
    return (
      <div>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="subtitle1" color="inherit">
              欢迎
            </Typography>
          </Toolbar>
          <Tabs
            style={{ backgroundColor: "#fff" }}
            value={index}
            onChange={handleChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            aria-label="full width tabs example"
          >
            <Tab label="登陆" {...a11yProps(0)} />
            <Tab label="注册" {...a11yProps(1)} />
          </Tabs>
        </AppBar>
        {index === 0 && (
          <div style={{ padding: 10 }}>
            <TextField
              label="输入用户名"
              fullWidth
              value={userName}
              onChange={(event) => {
                setUserName(event.target.value);
                setTipText("");
              }}
            />
            <TextField
              label={"输入密码"}
              fullWidth
              type={"password"}
              value={passWord}
              onChange={(event) => {
                setPassWord(event.target.value);
                setTipText("");
              }}
            />
            {tipText && <UITipText>{tipText}</UITipText>}

            <Button
              variant="contained"
              color="secondary"
              disabled={!userName || !passWord}
              style={{ width: "100%", marginTop: 10 }}
              onClick={handleSignin}
            >
              登陆
            </Button>
          </div>
        )}
        {index === 1 && (
          <div style={{ padding: 10 }}>
            <TextField
              label="输入用户名"
              fullWidth
              value={userName}
              onChange={(event) => {
                setUserName(event.target.value);
                setTipText("");
              }}
            />
            <TextField
              label={"输入密码"}
              fullWidth
              type={"password"}
              value={passWord}
              onChange={(event) => {
                setPassWord(event.target.value);
                setTipText("");
              }}
            />
            <TextField
              label={"重新输入密码"}
              fullWidth
              type={"password"}
              value={passWord1}
              onChange={(event) => {
                setPassWord1(event.target.value);
                setTipText("");
              }}
            />
            {tipText && <UITipText>{tipText}</UITipText>}
            <Button
              variant="contained"
              color="secondary"
              disabled={!userName || !passWord || !passWord1}
              style={{ width: "100%", marginTop: 10 }}
              onClick={handleSignup}
            >
              注册
            </Button>
          </div>
        )}
      </div>
    );
  };

  const isLogin = user !== null && validToken;

  return (
    <UILoginWrap>
      <div>
        <Paper style={{ width: 350, marginTop: 60 }}>
          {isLogin ? renderUserWelcome() : renderLogin()}
        </Paper>
      </div>
    </UILoginWrap>
  );
}
