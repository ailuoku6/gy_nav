import { useCallback, useEffect, useRef, useState } from 'react';
// import './App.css';
import './home.css';
import HeadBar from '../component/HeadBar/HeadBar';
import Partition from '../component/Partition/Partition';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import FriendSite from '../component/FriendSite/FriendSite';
import Footer from '../component/Footer/Footer';
import FeaturePanel from '../component/FeaturePanel/index';
import SettingsIcon from '@mui/icons-material/Settings';
import DoneIcon from '@mui/icons-material/Done';
//import Paper from '@mui/material/Paper';
//import Grid from '@mui/material/Grid';
import MarginHead from '../component/MarginHead/MarginHead';
import PopularSite from '../component/PopularSite/PopularSite';
import { useDispatch, useSelector } from 'react-redux';
import {
  setDevice,
  setSugShow,
  setMarchineShow,
  setMarchineIndex,
  // setUser,
  addPart2Rear,
  setPartition,
  setGlobalMsg,
} from '../redux/actions';
import Marchinelist from '../utils/SearchMarchine';
import GyDialog from '../component/GyDialog/GyDialog';
import Snackbar from '@mui/material/Snackbar';
//import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
// import Dialog from '@mui/material/Dialog';
// import DialogActions from '@mui/material/DialogActions';
// import DialogContent from '@mui/material/DialogContent';
// import DialogContentText from '@mui/material/DialogContentText';
// import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from '@mui/material/Tooltip';
import { post } from '../utils/http';
import { ValidToken, GetPartData } from '../utils/Api';
import {
  GetMarchineIndexStore,
  // SetUserStore,
  GetUserStore,
  GetPartDataStore,
} from '../utils/localStorageUtil';

import throttle from '../utils/throttle';
import eventBus from '../utils/EventEmitter';
import { homeKeyDown } from '../utils/Events';
import { KeyboardEvent } from 'hono/jsx';
import { DeviceTypes } from '../redux/types';
import { StoreType } from '../redux/store';

const Home = () => {
  const appRef = useRef<HTMLDivElement>(null);
  const [edit, setEdit] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [addPartOpen, setAddPartOpen] = useState(false);
  // const [datas, setDatas] = useState([]);
  const userRef = useRef(null);

  const { selectMcIndex, user, globalMsg, Show } = useSelector<
    StoreType,
    {
      device: StoreType['Device']['device'];
      selectMcIndex: StoreType['MarchineIndex']['index'];
      user: StoreType['User']['user'];
      globalMsg: StoreType['GlobalMsg'];
      Show: StoreType['Show'];
    }
  >(({ Device, MarchineIndex, User, GlobalMsg, Show }) => ({
    device: Device.device,
    selectMcIndex: MarchineIndex.index,
    user: User.user,
    globalMsg: GlobalMsg,
    Show,
  }));

  const dispatch = useDispatch();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    console.log('home监听', e);
    eventBus.emit(homeKeyDown, [e]);
  }, []);

  // const handleScroll = () => {
  //   if (
  //     (window.pageYOffset ||
  //       document.documentElement.scrollTop ||
  //       //safari浏览器的拖动会使其为负数
  //       document.body.scrollTop) <= 0
  //   ) {
  //     setScrolled(false);
  //     console.log('不添加阴影');
  //   } else {
  //     if (scrolled === false) {
  //       setScrolled(true);
  //       console.log('添加阴影');
  //     }
  //   }
  // };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttleHandleScroll = useCallback(
    throttle(() => {
      if (
        (window.pageYOffset ||
          document.documentElement.scrollTop ||
          //safari浏览器的拖动会使其为负数
          document.body.scrollTop) <= 0
      ) {
        setScrolled(false);
        console.log('不添加阴影');
      } else {
        if (scrolled === false) {
          setScrolled(true);
          console.log('添加阴影');
        }
      }
    }, 30),
    []
  );

  const initMarchine = () => {
    const marchineIndex = GetMarchineIndexStore();
    console.log('启动时读取搜索引擎选择', marchineIndex);
    if (marchineIndex !== null && marchineIndex !== undefined) {
      dispatch(setMarchineIndex(Number.parseInt(marchineIndex), false));
    }
  };

  const initUser = () => {
    const user = GetUserStore();
    if (user !== null && user !== undefined) {
      console.log('从本地读取到了用户', user.userName);
      userRef.current = user;
    }
  };

  // const handleParClose = () => {
  //   setAddPartOpen(false);
  // };

  const judgeDevice = () => {
    const sUserAgent = navigator.userAgent;
    const mobileAgents = [
      'Android',
      'iPhone',
      'Symbian',
      'WindowsPhone',
      'iPod',
      'BlackBerry',
      'Windows CE',
    ];
    for (let i = 0; i < mobileAgents.length; i++) {
      if (sUserAgent.indexOf(mobileAgents[i]) > -1) {
        dispatch(setDevice(DeviceTypes.phone));
        break;
      }
    }
  };

  useEffect(() => {
    document.title = 'GY导航';
    // window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('scroll', throttleHandleScroll);
    window.addEventListener('keydown', handleKeyDown);
    //this.appRef.current.addEventListener('keypress',this.handleKeyDown);
    //React.addEventListener('keypress',this.handleKeyDown);
    judgeDevice();
    // 读取搜索引擎数据
    initMarchine();
    initUser();
    if (userRef.current) {
      console.log('验证token');
      post(ValidToken, {});
    }
    if (userRef.current === null) {
      console.log('读取本地');

      const partData = GetPartDataStore();
      if (partData) {
        dispatch(setPartition(partData, false, false));
      }
    } else {
      //优先读取网络partData,不成功则读取本地partData
      console.log('读取服务器数据...');
      post(GetPartData, {})
        .then((data) => {
          console.log('服务器返回的数据', data);
          if (data.result) {
            console.log('使用服务器的数据');
            dispatch(setPartition(JSON.parse(data.partData), true, false));
          } else {
            console.log('使用本地的数据');
            const partData = GetPartDataStore();
            if (partData) {
              dispatch(setPartition(partData, false, false)); //从本地读取，所以没必要再存回本地
            }
          }
        })
        .catch((err) => {
          console.log('使用本地的数据');
          const partData = GetPartDataStore();
          if (partData) {
            dispatch(setPartition(partData, false, false)); //从本地读取，所以没必要再存回本地
          }

          console.log(err);
        });
    }
    return () => {
      window.removeEventListener('scroll', throttleHandleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fabColor = Marchinelist[selectMcIndex].color;

  return (
    <div
      className="App"
      ref={appRef}
      onClick={() => {
        if (Show.marchine) {
          dispatch(setMarchineShow(false));
        }
        if (Show.sug) {
          dispatch(setSugShow(false));
        }
      }}
    >
      <FeaturePanel />
      <HeadBar Scrolled={scrolled} />
      <MarginHead />
      <PopularSite />
      <Partition
        // Pts={this.props.Partition}
        Edit={edit}
      />
      {edit && (
        <div
          style={{
            height: 170,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Fab
            color="primary"
            aria-label="add"
            size={'small'}
            onClick={() => {
              setAddPartOpen(true);
            }}
          >
            <AddIcon />
          </Fab>
        </div>
      )}
      <FriendSite />
      <Footer />
      <Fab
        color="inherit"
        aria-label="add"
        size={'small'}
        style={{
          position: 'fixed',
          right: 30,
          bottom: 30,
          backgroundColor: fabColor,
          height: 36,
          width: 36,
        }}
        onClick={() => {
          setEdit((v) => !v);
        }}
      >
        {edit ? (
          <DoneIcon color={'inherit'} style={{ color: '#fff' }} />
        ) : (
          <SettingsIcon color={'inherit'} style={{ color: '#fff' }} />
        )}
      </Fab>
      <Link to={'/login'}>
        <Tooltip title={user?.userName || '未登陆'} placement="top">
          <Fab
            color="inherit"
            aria-label="add"
            size={'small'}
            style={{
              position: 'fixed',
              right: 30,
              bottom: 80,
              backgroundColor: fabColor,
              color: '#fff',
              height: 36,
              width: 36,
            }}
            onClick={() => {}}
          >
            {user?.userName[0] || '未'}
          </Fab>
        </Tooltip>
      </Link>

      <GyDialog
        open={addPartOpen}
        title={'创建新分区'}
        onClose={() => {
          setAddPartOpen(false);
        }}
        onCancel={() => {
          setAddPartOpen(false);
        }}
        onConfirm={(partName) => {
          if (partName) {
            dispatch(addPart2Rear(partName));
          } else {
            console.log('给点东西吧');
          }
          setAddPartOpen(false);
        }}
      />

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={globalMsg.show}
        autoHideDuration={3000}
        onClose={() => {
          dispatch(setGlobalMsg('', false));
        }}
        message={globalMsg.msg}
        key={'globalMsg'}
      />
    </div>
  );
};

export default Home;