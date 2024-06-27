import React from 'react';
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
import { connect } from 'react-redux';
import {
  setDevice,
  setSugShow,
  setMarchineShow,
  setMarchineIndex,
  setUser,
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
  SetUserStore,
  GetUserStore,
  GetPartDataStore,
} from '../utils/localStorageUtil';

import throttle from '../utils/throttle';
import eventBus from '../utils/EventEmitter';
import { homeKeyDown } from '../utils/Events';

class Home extends React.Component {
  // eslint-disable-next-line no-useless-constructor
  constructor(props) {
    super(props);
    this.appRef = React.createRef();
    this.state = {
      edit: false,
      scrolled: false,
      AddParOpen: false,
      datas: [],
    };
    this.user = null;
  }

  handleKeyDown(e) {
    console.log('home监听', e);
    eventBus.emit(homeKeyDown, [e]);
  }

  componentDidMount() {
    document.title = 'GY导航';
    // window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('scroll', this.throttleHandleScroll);
    window.addEventListener('keydown', this.handleKeyDown);
    //this.appRef.current.addEventListener('keypress',this.handleKeyDown);
    //React.addEventListener('keypress',this.handleKeyDown);
    this.JudgeDevice();
    // 读取搜索引擎数据
    this.initMarchine();
    this.initUser();
    // TODO 发一个验证token的请求
    if (this.user) {
      console.log('验证token');
      post(ValidToken, {});
    }
    if (this.user === null) {
      console.log('读取本地');
      // let userinfo = GetUserStore();
      // console.log(userinfo);
      // this.props.setUser(userinfo);
      //let datas = localStorage.getItem("datas");
      // let datas = GetlocalStorage('datas');
      // if (datas!=null&&datas!=''){
      //     this.setState({
      //         datas:datas
      //     })
      // }else {
      //     this.getInitData();
      // }

      let partData = GetPartDataStore();
      if (partData) {
        this.props.setPartition(partData, false, false); //从本地读取，所以没必要再存回本地
      }
    } else {
      //优先读取网络partData,不成功则读取本地partData
      console.log('读取服务器数据...');
      post(GetPartData, null)
        .then((data) => {
          console.log('服务器返回的数据', data);
          if (data.result) {
            console.log('使用服务器的数据');
            this.props.setPartition(JSON.parse(data.partData), true, false); //从服务器读取，保存本地但不上传
          } else {
            console.log('使用本地的数据');
            let partData = GetPartDataStore();
            if (partData) {
              this.props.setPartition(partData, false, false); //从本地读取，所以没必要再存回本地
            }
          }
        })
        .catch((err) => {
          console.log('使用本地的数据');
          let partData = GetPartDataStore();
          if (partData) {
            this.props.setPartition(partData, false, false); //从本地读取，所以没必要再存回本地
          }

          console.log(err);
        });
    }
  }

  initMarchine() {
    let marchineIndex = GetMarchineIndexStore();
    console.log('启动时读取搜索引擎选择', marchineIndex);
    if (marchineIndex !== null && marchineIndex !== undefined) {
      this.props.setMarchineIndex(Number.parseInt(marchineIndex), false);
    }
  }

  initUser() {
    let user = GetUserStore();
    if (user !== null && user !== undefined) {
      console.log('从本地读取到了用户', user.userName);
      this.user = user;
      //this.props.setUser(user);
    }
  }

  getInitData() {
    // get(GetInitData,{}).then((data)=>{
    //     //localStorage.setItem("datas",JSON.stringify(data));
    //     SetlocalStorage('datas',data);
    //     this.setState({
    //         datas:data
    //     })
    // }).catch((err)=>{
    //     console.log(err)
    // })
  }

  handleParClose() {
    this.setState({
      AddParOpen: false,
    });
  }

  JudgeDevice() {
    let sUserAgent = navigator.userAgent;
    let mobileAgents = [
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
        // this.flag = "phone";
        // this.border_width = 1;
        this.props.setDevice('phone');
        break;
      }
    }
  }

  componentWillUnmount() {
    // window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('scroll', this.throttleHandleScroll);
    window.removeEventListener('keydown', this.handleKeyDown);
    //React.removeEventListener('keypress',this.handleKeyDown);
  }

  render() {
    let fabColor = Marchinelist[this.props.selectMcIndex].color;

    return (
      <div
        className="App"
        ref={this.appRef}
        onClick={() => {
          if (this.props.Show.marchine) {
            this.props.setMarchineShow(false);
          }
          if (this.props.Show.sug) {
            this.props.setSugShow(false);
          }
        }}
      >
        <FeaturePanel />
        <HeadBar Scrolled={this.state.scrolled} />
        <MarginHead />
        <PopularSite />
        <Partition
          // Pts={this.props.Partition}
          Edit={this.state.edit}
        />
        {this.state.edit && (
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
                this.setState({
                  AddParOpen: true,
                });
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
            let edit = !this.state.edit;
            this.setState({
              edit: edit,
            });
          }}
        >
          {this.state.edit ? (
            <DoneIcon color={'inherit'} style={{ color: '#fff' }} />
          ) : (
            <SettingsIcon color={'inherit'} style={{ color: '#fff' }} />
          )}
        </Fab>
        <Link to={'/login'}>
          <Tooltip
            title={
              this.props.user !== null ? this.props.user.userName : '未登陆'
            }
            placement="top"
          >
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
              {this.props.user !== null ? this.props.user.userName[0] : '未'}
            </Fab>
          </Tooltip>
        </Link>

        <GyDialog
          open={this.state.AddParOpen}
          title={'创建新分区'}
          onClose={() => {
            this.setState({
              AddParOpen: false,
            });
          }}
          onCancel={() => {
            this.setState({
              AddParOpen: false,
            });
          }}
          onConfirm={(partName) => {
            if (partName) {
              this.props.addPart2Rear(partName);
            } else {
              console.log('给点东西吧');
            }
            this.setState({
              AddParOpen: false,
            });
          }}
        />

        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          open={this.props.globalMsg.show}
          autoHideDuration={3000}
          onClose={() => {
            this.props.setGlobalMsg('', false);
          }}
          message={this.props.globalMsg.msg}
          key={'globalMsg'}
        />
      </div>
    );
  }

  handleScroll = () => {
    if (
      (window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop) <= 0
    ) {
      //safari浏览器的拖动会使其为负数
      // this.scrolled = false;
      this.setState({
        scrolled: false,
      });
      console.log('不添加阴影');
    } else {
      if (this.state.scrolled === false) {
        this.setState({
          scrolled: true,
        });
        console.log('添加阴影');
      }
    }
  };

  throttleHandleScroll = throttle(this.handleScroll, 30);
}

const mapStateToProps = ({ Device, MarchineIndex, User, GlobalMsg, Show }) => ({
  device: Device.device,
  selectMcIndex: MarchineIndex.index,
  user: User.user,
  globalMsg: GlobalMsg,
  Show,
});

const mapDispatchToProps = {
  setDevice,
  setSugShow,
  setMarchineShow,
  setMarchineIndex,
  setUser,
  addPart2Rear,
  setPartition,
  setGlobalMsg,
};

// export default App;

export default connect(mapStateToProps, mapDispatchToProps)(Home);
