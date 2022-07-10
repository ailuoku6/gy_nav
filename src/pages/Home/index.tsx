import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

// import './App.css';
import HeadBar from "../../containers/HeadBar";
import Partition from "../../containers/Partition";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";
import FriendSite from "../../component/FriendSite";
import Footer from "../../component/Footer";
import SettingsIcon from "@material-ui/icons/Settings";
import DoneIcon from "@material-ui/icons/Done";
//import Paper from '@material-ui/core/Paper';
//import Grid from '@material-ui/core/Grid';
import MarginHead from "../../component/MarginHead";
import PopularSite from "../../component/PopularSite";
// import { connect } from "react-redux";
import {
  setDevice,
  setSugShow,
  setMarchineShow,
  setMarchineIndex,
  //   setUser,
  addPart2Rear,
  setPartition,
  setGlobalMsg,
} from "../../redux/actions";
import Marchinelist from "../../utils/SearchMarchine";
import GyDialog from "../../component/GyDialog";
import Snackbar from "@material-ui/core/Snackbar";
//import Button from '@material-ui/core/Button';
import { Link } from "react-router-dom";
// import Dialog from '@material-ui/core/Dialog';
// import DialogActions from '@material-ui/core/DialogActions';
// import DialogContent from '@material-ui/core/DialogContent';
// import DialogContentText from '@material-ui/core/DialogContentText';
// import DialogTitle from '@material-ui/core/DialogTitle';
import Tooltip from "@material-ui/core/Tooltip";
import { post } from "../../utils/http";
import { ValidToken, GetPartData } from "../../utils/Api";
import {
  GetMarchineIndexStore,
  //   SetUserStore,
  GetUserStore,
  GetPartDataStore,
} from "../../utils/localStorageUtil";

import throttle from "../../utils/throttle";
import eventBus from "../../utils/EventEmitter";
import { homeKeyDown } from "../../utils/Events";

export default function Home() {
  const { user, selectMcIndex, globalMsg, show } = useSelector(
    (state: any) => ({
      //   device: state.Device.device,
      user: state.User.user,
      selectMcIndex: state.MarchineIndex.index,
      globalMsg: state.GlobalMsg,
      show: state.Show,
      // Partition: state.Partition.data,
    })
  );

  const dispatch = useDispatch();

  const [edit, setEdit] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [addParOpen, setAddParOpen] = useState<boolean>(false);
  //   const [datas, setDatas] = useState<any[]>([]);

  const userRef = useRef<any>(null);

  const appRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: any) => {
    console.log("home监听", e);
    eventBus.emit(homeKeyDown, [e]);
  };

  const initMarchine = () => {
    let marchineIndex = GetMarchineIndexStore();
    console.log("启动时读取搜索引擎选择", marchineIndex);
    if (marchineIndex !== null && marchineIndex !== undefined) {
      // this.props.setMarchineIndex(Number.parseInt(marchineIndex),false);
      dispatch(setMarchineIndex(Number.parseInt(marchineIndex), false));
    }
  };

  const initUser = () => {
    let user = GetUserStore();
    if (user !== null && user !== undefined) {
      console.log("从本地读取到了用户", user.userName);
      userRef.current = user;
    }
  };

  const JudgeDevice = () => {
    let sUserAgent = navigator.userAgent;
    let mobileAgents = [
      "Android",
      "iPhone",
      "Symbian",
      "WindowsPhone",
      "iPod",
      "BlackBerry",
      "Windows CE",
    ];
    for (let i = 0; i < mobileAgents.length; i++) {
      if (sUserAgent.indexOf(mobileAgents[i]) > -1) {
        // this.flag = "phone";
        // this.border_width = 1;
        dispatch(setDevice("phone"));
        break;
      }
    }
  };

  const handleScroll = () => {
    if (
      (window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop) <= 0
    ) {
      //safari浏览器的拖动会使其为负数
      setScrolled(false);
      console.log("不添加阴影");
    } else {
      if (scrolled === false) {
        setScrolled(true);
        console.log("添加阴影");
      }
    }
  };

  const throttleHandleScroll = throttle(handleScroll, 30);

  useEffect(() => {
    document.title = "GY导航";
    // window.addEventListener('scroll', this.handleScroll);
    window.addEventListener("scroll", throttleHandleScroll);
    window.addEventListener("keydown", handleKeyDown);
    //this.appRef.current.addEventListener('keypress',this.handleKeyDown);
    //React.addEventListener('keypress',this.handleKeyDown);
    JudgeDevice();
    // 读取搜索引擎数据
    initMarchine();
    initUser();
    // TODO 发一个验证token的请求
    if (userRef.current) {
      console.log("验证token");
      post(ValidToken, {});
    }
    if (userRef.current === null) {
      console.log("读取本地");

      let partData = GetPartDataStore();
      if (partData) {
        dispatch(setPartition(partData, false, false)); //从本地读取，所以没必要再存回本地
      }
    } else {
      //优先读取网络partData,不成功则读取本地partData
      console.log("读取服务器数据...");
      post(GetPartData, null)
        .then((data) => {
          console.log("服务器返回的数据", data);
          if (data.result) {
            console.log("使用服务器的数据");
            dispatch(setPartition(JSON.parse(data.partData), true, false)); //从服务器读取，保存本地但不上传
          } else {
            console.log("使用本地的数据");
            let partData = GetPartDataStore();
            if (partData) {
              dispatch(setPartition(partData, false, false)); //从本地读取，所以没必要再存回本地
            }
          }
        })
        .catch((err) => {
          console.log("使用本地的数据");
          let partData = GetPartDataStore();
          if (partData) {
            dispatch(setPartition(partData, false, false)); //从本地读取，所以没必要再存回本地
          }

          console.log(err);
        });
    }

    return () => {
      window.removeEventListener("scroll", throttleHandleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const fabColor = Marchinelist[selectMcIndex].color;

  return (
    <div
      className="App"
      ref={appRef}
      onClick={() => {
        if (show.marchine) {
          dispatch(setMarchineShow(false));
        }
        if (show.sug) {
          dispatch(setSugShow(false));
        }
      }}
    >
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
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Fab
            color="primary"
            aria-label="add"
            size={"small"}
            onClick={() => {
              setAddParOpen(true);
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
        size={"small"}
        style={{
          position: "fixed",
          right: 30,
          bottom: 30,
          backgroundColor: fabColor,
          height: 36,
          width: 36,
        }}
        onClick={() => {
          setEdit(!edit);
        }}
      >
        {edit ? (
          <DoneIcon color={"inherit"} style={{ color: "#fff" }} />
        ) : (
          <SettingsIcon color={"inherit"} style={{ color: "#fff" }} />
        )}
      </Fab>
      <Link to={"/login"}>
        <Tooltip
          title={user !== null ? user.userName : "未登陆"}
          placement="top"
        >
          <Fab
            color="inherit"
            aria-label="add"
            size={"small"}
            style={{
              position: "fixed",
              right: 30,
              bottom: 80,
              backgroundColor: fabColor,
              color: "#fff",
              height: 36,
              width: 36,
            }}
            onClick={() => {}}
          >
            {user !== null ? user.userName[0] : "未"}
          </Fab>
        </Tooltip>
      </Link>

      <GyDialog
        open={addParOpen}
        title={"创建新分区"}
        onClose={() => {
          setAddParOpen(false);
        }}
        onCancel={() => {
          setAddParOpen(false);
        }}
        onConfirm={(partName) => {
          if (partName) {
            dispatch(addPart2Rear(partName));
          } else {
            console.log("给点东西吧");
          }

          setAddParOpen(false);
        }}
      />

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={globalMsg.show}
        autoHideDuration={3000}
        onClose={() => {
          dispatch(setGlobalMsg("", false));
        }}
        message={globalMsg.msg}
        key={"globalMsg"}
      />
    </div>
  );
}
