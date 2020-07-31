import React from 'react';
import './App.css';

import Router from './router/router'
import { setUser } from './redux/actions';
import {GetUserStore} from "./utils/localStorageUtil";
// import {GetPartData,ValidToken} from './utils/Api'
// import {get,post} from "./utils/http";
import { connect } from "react-redux";

class App extends React.Component{
    // eslint-disable-next-line no-useless-constructor
    constructor(props){
        super(props);
        this.state = {
        }
        //this.user = null;
    }

    componentDidMount(){
        this.initUser();
        // TODO 发一个验证token的请求
        // if(this.user){
        //     console.log("验证token");
        //     post(ValidToken,{});
        // }
        // if (this.user===null){
        //     console.log("读取本地");
        //     // let userinfo = GetUserStore();
        //     // console.log(userinfo);
        //     // this.props.setUser(userinfo);
        //     //let datas = localStorage.getItem("datas");
        //     // let datas = GetlocalStorage('datas');
        //     // if (datas!=null&&datas!=''){
        //     //     this.setState({
        //     //         datas:datas
        //     //     })
        //     // }else {
        //     //     this.getInitData();
        //     // }

        //     let partData = GetPartDataStore();
        //     this.props.setPartition(partData,false);//从本地读取，所以没必要再存回本地

        // }else{
        //     //优先读取网络partData,不成功则读取本地partData
        //     console.log("读取服务器数据...");
        //     post(GetPartData,null).then((data)=>{
        //         console.log("服务器返回的数据",data);
        //         if(data.result){
        //             console.log("使用服务器的数据");
        //             this.props.setPartition(data.partData,true,false);//从服务器读取，保存本地但不上传
        //         }else{
        //             console.log("使用本地的数据");
        //             let partData = GetPartDataStore();
        //             this.props.setPartition(partData,false,false);//从本地读取，所以没必要再存回本地
        //         }
        //     }).catch((err)=>{
        //         console.log("使用本地的数据");
        //         let partData = GetPartDataStore();
        //         this.props.setPartition(partData,false,false);//从本地读取，所以没必要再存回本地
        //         console.log(err);
        //     })
        // }
    }

    initUser(){
        let user = GetUserStore();
        if(user!==null&&user!==undefined){
            console.log("从本地读取到了用户",user.userName);
            //this.user = user;
            this.props.setUser(user);
        }
    }

    render() {
        console.log("App刷新了");

        return(
            <Router/>
        )
    }

}

const mapStateToProps = ({User}) => ({
    user:User.user
});

const mapDispatchToProps = { setUser };

// export default App;

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App);
// export default App;
