import React from 'react';
// import LoginRegister from 'react-mui-login-register';
import { connect } from "react-redux";
import { setDevice,setUser,setPartition } from './../redux/actions';
import {AppBar,Toolbar,Typography,Paper,Button,Avatar} from '@material-ui/core'
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import TextField from '@material-ui/core/TextField';
import { post } from '../utils/http';
import { Signin,SignUp } from "../utils/Api";
import {pswPattern} from '../utils/veriLink'
import {Link} from "react-router-dom";
import './login.css'

import { SetUserStore,GetTokenStore,SetTokenStore,GetUserStore } from "../utils/localStorageUtil";
import {history} from '../router/router'

function a11yProps(index) {
    return {
        id: `full-width-tab-${index}`,
        'aria-controls': `full-width-tabpanel-${index}`,
    };
}

// TabPanel.propTypes = {
//     children: PropTypes.node,
//     index: PropTypes.any.isRequired,
//     value: PropTypes.any.isRequired,
// };
class Login extends React.Component{
    // eslint-disable-next-line no-useless-constructor
    constructor(props){
        super(props);
        this.state = {
            index:0,
            userName:'',
            passWord:'',
            passWord1:'',
            tipText:'',
            validToken:false
        }
        this.user = null;
    }

    componentDidMount() {
        document.title = "注册/登陆";
        console.log("读取配置",this.props.user);
        this.initUser();
        if (this.user!==null){
            // let userinfo = localStorage.getItem("userInfo");
            // console.log(userinfo);
            // this.props.setUser(JSON.parse(userinfo))
            // let userinfo = GetlocalStorage('userInfo');
            // this.props.setUser(userinfo);
            this.setState({
                userName:this.user.userName,
                passWord:this.user.passWord,
            });
        }else{

        }
        let token = GetTokenStore();
        if(token){
            this.setState({
                validToken:true
            });
        }

    }

    initUser(){
        let user = GetUserStore();
        if(user!==null&&user!==undefined){
            console.log("从本地读取到了用户",user.userName);
            this.user = user;
            //this.props.setUser(user,false);
        }
    }

    handleChange = (event, newValue) => {
        // setValue(newValue);
        // console.log(newValue)
        this.setState({
            index:newValue,
            tipText:''
        })
    };

    handleSignin(){
        if (!this.state.userName||!this.state.passWord) return;
        let data = {};
        //userName,passWord
        data.userName = this.state.userName;
        data.passWord = this.state.passWord;
        post(Signin,data).then((data)=>{
            console.log(data);
            if (data.result===false){
                this.setState({
                    tipText:data.msg
                });
                return;
            }

            //剔除partData属性，并把相关东西存起来
            //localStorage.userInfo = JSON.stringify(data);
            //SetlocalStorage('userInfo',data);

            let user = data.user;
            let partData = user.partData;
            delete user.partData;
            user.passWord = this.state.passWord;

            this.props.setPartition(JSON.parse(partData),true,false);
            this.props.setUser(user);

            history.replace("/")
        }).catch((err)=>{
            console.log(err)
        })
    }

    handleSignup(){
        if(this.state.passWord.length<6||pswPattern.test(this.state.passWord)){
            this.setState({
                tipText:'密码不能少于6位，且不能含有中文'
            });
            return;
        }
        if (this.state.passWord!==this.state.passWord1){
            this.setState({
                tipText:'两次输入的密码不一致'
            });
            return;
        }

        let data = {};
        //userName,passWord
        data.userName = this.state.userName;
        data.passWord = this.state.passWord;
        data.partData = JSON.stringify(this.props.Partition);
        post(SignUp,data).then((data)=>{
            console.log(data);
            if (data.result===false){
                this.setState({
                    tipText:data.msg
                });
                return;
            }
            //SetlocalStorage('userInfo',data.user);
            //localStorage.userInfo = JSON.stringify(data);

            // let user = data.user;
            // delete user.partData;

            //TODO 剔除partData属性

            let user = data.user;
            let partData = user.partData;
            delete user.partData;
            user.passWord = this.state.passWord;

            this.props.setPartition(JSON.parse(partData),true,false);
            this.props.setUser(user);
            history.replace("/")
        }).catch((err)=>{
            console.log(err)
        })

    }

    render() {

        let isLogin = this.props.user!==null&&this.state.validToken;

        // let fabColor = '#3388ff';
        return(
            <div style={{width:'100%',height:'100%',display:'flex',justifyContent:'center',backgroundColor:'#03a9f4'}}>
                <div>
                    <Paper style={{width:350,marginTop:60}}>

                        {
                            isLogin?(
                                <div>
                                    <AppBar position="static">
                                        <Toolbar>
                                            <Typography variant="title" color="inherit">{'欢迎你， '+this.props.user.userName}</Typography>
                                        </Toolbar>
                                    </AppBar>
                                    <div style={{padding:10}}>
                                        <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:10}}>
                                            <Avatar>{this.props.user.userName[0]}</Avatar>
                                        </div>

                                        <Link to={'/'}>
                                            <Button variant="contained" color="secondary" style={{width:'100%'}}>返回</Button>
                                        </Link>
                                        <Button variant="contained" style={{width:'100%',marginTop:10}} onClick={()=>{
                                            //localStorage.removeItem("userInfo");
                                            //RemovelocalStorage('userInfo');
                                            SetTokenStore("");
                                            SetUserStore("");
                                            this.props.setUser(null)
                                        }}>登出</Button>

                                    </div>
                                </div>
                            ):(
                                <div>
                                    <AppBar position="static">
                                        <Toolbar>
                                            <Typography variant="subtitle1" color="inherit">欢迎</Typography>
                                        </Toolbar>
                                        <Tabs
                                            style={{backgroundColor:'#fff'}}
                                            value={this.state.index}
                                            onChange={this.handleChange}
                                            indicatorColor='primary'
                                            textColor="primary"
                                            variant="fullWidth"
                                            aria-label="full width tabs example"
                                        >
                                            <Tab label="登陆" {...a11yProps(0)} />
                                            <Tab label="注册" {...a11yProps(1)} />
                                        </Tabs>
                                    </AppBar>
                                    {
                                        this.state.index===0&&(
                                            <div style={{padding:10}}>
                                                <TextField
                                                    label="输入用户名"
                                                    fullWidth
                                                    value={this.state.userName}
                                                    onChange={(event)=>{
                                                        this.setState({
                                                            userName:event.target.value,
                                                            tipText:''
                                                        })
                                                    }}
                                                />
                                                <TextField
                                                    label={'输入密码'}
                                                    fullWidth
                                                    type={'password'}
                                                    value={this.state.passWord}
                                                    onChange={(event)=>{
                                                        this.setState({
                                                            passWord:event.target.value,
                                                            tipText:''
                                                        })
                                                    }}
                                                />
                                                {this.state.tipText&&(
                                                    <div style={{color:'#ff430f'}}>
                                                        {this.state.tipText}
                                                    </div>
                                                )}

                                                <Button variant="contained" color="secondary" disabled={!this.state.userName||!this.state.passWord} style={{width:'100%',marginTop:10}} onClick={()=>{
                                                    this.handleSignin()
                                                }}>
                                                    登陆
                                                </Button>
                                            </div>
                                        )
                                    }
                                    {
                                        this.state.index===1&&(
                                            <div style={{padding:10}}>
                                                <TextField
                                                    label="输入用户名"
                                                    fullWidth
                                                    value={this.state.userName}
                                                    onChange={(event)=>{
                                                        this.setState({
                                                            userName:event.target.value,
                                                            tipText:''
                                                        })
                                                    }}
                                                />
                                                <TextField
                                                    label={'输入密码'}
                                                    fullWidth
                                                    type={'password'}
                                                    value={this.state.passWord}
                                                    onChange={(event)=>{
                                                        this.setState({
                                                            passWord:event.target.value,
                                                            tipText:''
                                                        })
                                                    }}
                                                />
                                                <TextField
                                                    label={'重新输入密码'}
                                                    fullWidth
                                                    type={'password'}
                                                    value={this.state.passWord1}
                                                    onChange={(event)=>{
                                                        this.setState({
                                                            passWord1:event.target.value,
                                                            tipText:''
                                                        })
                                                    }}
                                                />
                                                {this.state.tipText&&(
                                                    <div style={{color:'#ff430f'}}>
                                                        {this.state.tipText}
                                                    </div>
                                                )}
                                                <Button variant="contained" color="secondary" disabled={!this.state.userName||!this.state.passWord||!this.state.passWord1} style={{width:'100%',marginTop:10}} onClick={()=>{
                                                    this.handleSignup()
                                                }}>
                                                    注册
                                                </Button>
                                            </div>
                                        )
                                    }
                                </div>
                            )
                        }

                    </Paper>
                </div>

            </div>
        )
    }

}

const mapStateToProps = ({Device,User,Partition}) => ({
    device: Device.device,
    user:User.user,
    Partition:Partition.data
});

const mapDispatchToProps = { setDevice,setUser,setPartition };

// export default App;

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Login);
