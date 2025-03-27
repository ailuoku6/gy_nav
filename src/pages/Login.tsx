import { useEffect, useRef, useState } from 'react';
// import LoginRegister from 'react-mui-login-register';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setPartition } from '../redux/actions';
import {
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Button,
  Avatar,
} from '@mui/material';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import { post } from '../utils/http';
import { Signin, SignUp } from '../utils/Api';
import { pswPattern } from '../utils/veriLink';
import { Link } from 'react-router-dom';
import './login.css';

import {
  SetUserStore,
  GetTokenStore,
  SetTokenStore,
  GetUserStore,
} from '../utils/localStorageUtil';
import { history } from '../router/router';
import { StoreType } from '../redux/store';

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

const Login = () => {
  const [index, setIndex] = useState(0);
  const [userName, setUserName] = useState('');
  const [passWord, setPassWord] = useState('');
  const [passWord1, setPassWord1] = useState('');
  const [tipText, setTipText] = useState('');
  const [validToken, setValidToken] = useState(false);
  const userRef = useRef<any>(null);

  const { user, Partition } = useSelector<
    StoreType,
    {
      // device: StoreType['Device']['device'];
      user: StoreType['User']['user'];
      Partition: StoreType['Partition']['data'];
    }
  >(({ User, Partition }) => ({
    // device: Device.device,
    user: User.user,
    Partition: Partition.data,
  }));

  const dispatch = useDispatch();

  const initUser = () => {
    const user = GetUserStore();
    if (user !== null && user !== undefined) {
      console.log('从本地读取到了用户', user.userName);
      userRef.current = user;
    }
  };

  useEffect(() => {
    document.title = '注册/登陆';
    initUser();
    if (userRef.current !== null) {
      // let userinfo = localStorage.getItem("userInfo");
      // console.log(userinfo);
      // this.props.setUser(JSON.parse(userinfo))
      // let userinfo = GetlocalStorage('userInfo');
      // this.props.setUser(userinfo);
      setUserName(userRef.current.userName);
      setPassWord(userRef.current.passWord);
    }
    const token = GetTokenStore();
    if (token) {
      setValidToken(true);
    }
  }, []);

  const handleChange = (_: any, newValue: number) => {
    // setValue(newValue);
    // console.log(newValue)
    // this.setState({
    //   index: newValue,
    //   tipText: '',
    // });
    setIndex(newValue);
    setTipText('');
  };

  const handleSignin = () => {
    if (!userName || !passWord) return;
    const data = { userName, passWord };
    post(Signin, data)
      .then((data) => {
        console.log(data);
        if (data.result === false) {
          setTipText(data.msg);
          return;
        }

        //剔除partData属性，并把相关东西存起来
        //localStorage.userInfo = JSON.stringify(data);
        //SetlocalStorage('userInfo',data);

        const user = data.user;
        const partData = user.partData;
        delete user.partData;
        user.passWord = passWord;

        dispatch(setPartition(JSON.parse(partData), true, false));
        dispatch(setUser(user));

        history.replace('/');
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleSignup = () => {
    if (passWord.length < 6 || pswPattern.test(passWord)) {
      setTipText('密码不能少于6位，且不能含有中文');
      return;
    }
    if (passWord !== passWord1) {
      setTipText('两次输入的密码不一致');
      return;
    }

    const data = {
      userName,
      passWord,
      partData: JSON.stringify(Partition),
    };
    post(SignUp, data)
      .then((data) => {
        console.log(data);
        if (data.result === false) {
          setTipText(data.msg);
          return;
        }

        //TODO 剔除partData属性

        const user = data.user;
        const partData = user.partData;
        delete user.partData;
        user.passWord = passWord;

        dispatch(setPartition(JSON.parse(partData), true, false));
        dispatch(setUser(user));

        history.replace('/');
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const isLogin = user !== null && validToken;

  return (
    <div className="login-wrap">
      <div>
        <Paper style={{ width: 350, marginTop: 60 }}>
          {isLogin ? (
            <div>
              <AppBar position="static">
                <Toolbar>
                  <Typography color="inherit">
                    {'欢迎你， ' + user?.userName}
                  </Typography>
                </Toolbar>
              </AppBar>
              <div style={{ padding: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 10,
                  }}
                >
                  <Avatar>{user?.userName?.[0]}</Avatar>
                </div>

                <Link to={'/'}>
                  <Button
                    variant="contained"
                    color="secondary"
                    style={{ width: '100%' }}
                  >
                    返回
                  </Button>
                </Link>
                <Button
                  variant="contained"
                  style={{ width: '100%', marginTop: 10 }}
                  onClick={() => {
                    //localStorage.removeItem("userInfo");
                    //RemovelocalStorage('userInfo');
                    SetTokenStore('');
                    SetUserStore('');
                    dispatch(setUser(null));
                  }}
                >
                  登出
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <AppBar position="static">
                <Toolbar>
                  <Typography variant="subtitle1" color="inherit">
                    欢迎
                  </Typography>
                </Toolbar>
                <Tabs
                  style={{ backgroundColor: '#fff' }}
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
                    variant="standard"
                    label="输入用户名"
                    fullWidth
                    value={userName}
                    onChange={(event) => {
                      setUserName(event.target.value);
                      setTipText('');
                    }}
                  />
                  <TextField
                    label={'输入密码'}
                    variant="standard"
                    fullWidth
                    type={'password'}
                    value={passWord}
                    onChange={(event) => {
                      setPassWord(event.target.value);
                      setTipText('');
                    }}
                  />
                  {tipText && <div style={{ color: '#ff430f' }}>{tipText}</div>}

                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!userName || !passWord}
                    style={{ width: '100%', marginTop: 10 }}
                    onClick={() => {
                      handleSignin();
                    }}
                  >
                    登陆
                  </Button>
                </div>
              )}
              {index === 1 && (
                <div style={{ padding: 10 }}>
                  <TextField
                    label="输入用户名"
                    variant="standard"
                    fullWidth
                    value={userName}
                    onChange={(event) => {
                      setUserName(event.target.value);
                      setTipText('');
                    }}
                  />
                  <TextField
                    label={'输入密码'}
                    variant="standard"
                    fullWidth
                    type={'password'}
                    value={passWord}
                    onChange={(event) => {
                      setPassWord(event.target.value);
                      setTipText('');
                    }}
                  />
                  <TextField
                    label={'重新输入密码'}
                    variant="standard"
                    fullWidth
                    type={'password'}
                    value={passWord1}
                    onChange={(event) => {
                      setPassWord1(event.target.value);
                      setTipText('');
                    }}
                  />
                  {tipText && <div style={{ color: '#ff430f' }}>{tipText}</div>}
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!userName || !passWord || !passWord1}
                    style={{ width: '100%', marginTop: 10 }}
                    onClick={() => {
                      handleSignup();
                    }}
                  >
                    注册
                  </Button>
                </div>
              )}
            </div>
          )}
        </Paper>
      </div>
    </div>
  );
};

export default Login;
