import { SyntheticEvent, useEffect, useRef, useState } from 'react';
// import LoginRegister from 'react-mui-login-register';
import { appStore } from '../store/AppStore';
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
import { get, post, postJson } from '../utils/http';
import {
  PasskeyCredentials,
  PasskeyCredentialsDelete,
  PasskeyLoginOptions,
  PasskeyLoginVerify,
  PasskeyRegisterOptions,
  PasskeyRegisterVerify,
  Signin,
  SignUp,
} from '../utils/Api';
import { pswPattern } from '../utils/veriLink';
import { Link } from 'react-router-dom';
import './login.css';
import {
  createPasskeyCredential,
  getPasskeyAssertion,
  getPasskeyErrorMessage,
  isPasskeySupported,
} from '../utils/passkey';
import { confirmDeletePasskey } from '../utils/passkeyConfirm';

import {
  SetUserStore,
  GetTokenStore,
  SetTokenStore,
  GetUserStore,
} from '../utils/localStorageUtil';
import { history } from '../router/router';
import { observer } from 'kisstate';

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

type PasskeyCredentialItem = {
  id: number;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  transports?: string[];
};

type LoginSuccessData = {
  result: boolean;
  msg?: string;
  user?: {
    id: string;
    userName: string;
    passWord?: string;
    partData: string;
    popularSites?: string | unknown[];
  };
};

type StoredLoginUser = {
  userName: string;
  passWord?: string;
};

const Login = () => {
  const [index, setIndex] = useState(0);
  const [userName, setUserName] = useState('');
  const [passWord, setPassWord] = useState('');
  const [passWord1, setPassWord1] = useState('');
  const [tipText, setTipText] = useState('');
  const [validToken, setValidToken] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyCredentials, setPasskeyCredentials] = useState<
    PasskeyCredentialItem[]
  >([]);
  const userRef = useRef<StoredLoginUser | null>(null);

  const { user, partitionData: Partition } = appStore;
  const isLogin = user !== null && validToken;

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
      setPassWord(userRef.current.passWord || '');
    }
    const token = GetTokenStore();
    if (token) {
      setValidToken(true);
    }
  }, []);

  useEffect(() => {
    if (isLogin) {
      loadPasskeyCredentials();
    }
  }, [isLogin]);

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    // setValue(newValue);
    // console.log(newValue)
    // this.setState({
    //   index: newValue,
    //   tipText: '',
    // });
    setIndex(newValue);
    setTipText('');
  };

  const applyLoginSuccess = (
    data: LoginSuccessData,
    passwordForStorage?: string
  ) => {
    if (data.result === false) {
      setTipText(data.msg || '登录失败');
      return;
    }

    if (!data.user) {
      setTipText('登录响应缺少用户信息');
      return;
    }

    const { partData, popularSites, ...nextUser } = data.user;

    if (passwordForStorage) {
      nextUser.passWord = passwordForStorage;
    }

    appStore.setPartition(JSON.parse(partData), true, false);
    if (popularSites) {
      const parsed =
        typeof popularSites === 'string' ? JSON.parse(popularSites) : popularSites;
      if (Array.isArray(parsed)) {
        appStore.setPopularSite(parsed, true, false);
      }
    }
    appStore.setUser(nextUser);

    history.replace('/');
  };

  const loadPasskeyCredentials = () => {
    get(PasskeyCredentials, {})
      .then((data) => {
        if (data.result === false) {
          setTipText(data.msg);
          return;
        }
        setPasskeyCredentials(data.credentials || []);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleSignin = () => {
    if (!userName || !passWord) return;
    const data = { userName, passWord };
    post(Signin, data)
      .then((data) => {
        console.log(data);
        applyLoginSuccess(data, passWord);
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
        applyLoginSuccess(data, passWord);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handlePasskeySignin = async () => {
    if (!isPasskeySupported()) {
      setTipText('当前浏览器不支持 Passkey，请使用用户名密码登录');
      return;
    }

    setPasskeyBusy(true);
    setTipText('');
    try {
      const optionsData = await postJson(PasskeyLoginOptions, { userName });
      if (optionsData.result === false) {
        setTipText(optionsData.msg);
        return;
      }

      const credential = await getPasskeyAssertion(optionsData.options);
      const loginData = await postJson(PasskeyLoginVerify, { credential });
      applyLoginSuccess(loginData);
    } catch (error) {
      setTipText(getPasskeyErrorMessage(error));
    } finally {
      setPasskeyBusy(false);
    }
  };

  const handleBindPasskey = async () => {
    if (!isPasskeySupported()) {
      setTipText('当前浏览器不支持 Passkey');
      return;
    }

    setPasskeyBusy(true);
    setTipText('');
    try {
      const optionsData = await postJson(PasskeyRegisterOptions, {});
      if (optionsData.result === false) {
        setTipText(optionsData.msg);
        return;
      }

      const credential = await createPasskeyCredential(optionsData.options);
      const verifyData = await postJson(PasskeyRegisterVerify, {
        credential,
        name: '我的 Passkey',
      });
      if (verifyData.result === false) {
        setTipText(verifyData.msg);
        return;
      }

      setTipText('Passkey 绑定成功');
      loadPasskeyCredentials();
    } catch (error) {
      setTipText(getPasskeyErrorMessage(error));
    } finally {
      setPasskeyBusy(false);
    }
  };

  const handleDeletePasskey = async (id: number) => {
    if (!confirmDeletePasskey()) {
      return;
    }

    setPasskeyBusy(true);
    setTipText('');
    try {
      const data = await postJson(PasskeyCredentialsDelete, { id });
      if (data.result === false) {
        setTipText(data.msg);
        return;
      }
      setTipText('Passkey 已删除');
      loadPasskeyCredentials();
    } catch (error) {
      setTipText(getPasskeyErrorMessage(error));
    } finally {
      setPasskeyBusy(false);
    }
  };

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
                  variant="outlined"
                  color="primary"
                  disabled={passkeyBusy}
                  style={{ width: '100%', marginTop: 10 }}
                  onClick={handleBindPasskey}
                >
                  绑定 Passkey
                </Button>
                {passkeyCredentials.length > 0 && (
                  <div className="passkey-list">
                    {passkeyCredentials.map((credential) => (
                      <div className="passkey-item" key={credential.id}>
                        <div className="passkey-item-main">
                          <div className="passkey-item-name">
                            {credential.name || '我的 Passkey'}
                          </div>
                          <div className="passkey-item-time">
                            {credential.lastUsedAt
                              ? `最近使用 ${credential.lastUsedAt}`
                              : `创建于 ${credential.createdAt}`}
                          </div>
                        </div>
                        <Button
                          size="small"
                          color="secondary"
                          disabled={passkeyBusy}
                          onClick={() => handleDeletePasskey(credential.id)}
                        >
                          删除
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {tipText && <div style={{ color: '#ff430f' }}>{tipText}</div>}
                <Button
                  variant="contained"
                  style={{ width: '100%', marginTop: 10 }}
                  onClick={() => {
                    //localStorage.removeItem("userInfo");
                    //RemovelocalStorage('userInfo');
                    SetTokenStore('');
                    SetUserStore('');
                    appStore.setUser(null);
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
                  <Button
                    variant="outlined"
                    color="primary"
                    disabled={passkeyBusy}
                    style={{ width: '100%', marginTop: 10 }}
                    onClick={handlePasskeySignin}
                  >
                    使用 Passkey 登录
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

export default observer(Login);
