import React from 'react';
import './index.css';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Collapse from '@material-ui/core/Collapse';
import CancelIcon from '@material-ui/icons/Cancel';
import {SUGTIP} from "../../utils/Api";
import jsonp from 'jsonp'
import { connect } from "react-redux";
import {setSugShow, setMarchineShow, setMarchineIndex} from '../../redux/actions';
import Marchinelist from "../../utils/SearchMarchine";
//import { debounce } from 'throttle-debounce';
import debounce from "../../utils/debounce";
import {linkPattern} from '../../utils/veriLink'
// import http from '../../utils/http';

// const get = http.get;

class HeadBar extends React.Component{

    // eslint-disable-next-line no-useless-constructor
    constructor(props) {
        super(props);

        this.state={
            // marchine:['gvhg','hgvgvg','gvhgv','gyvhg'],
            showMarchine:false,
            sug:[],
            showSug:false,
            keyWord:'',
            Marchineselect_index:0,
            sugSelectIndex:0,
            // Marchinelist:[
            //     {Marchine_name:"百度",button_value:"百度一下",searApi:"https://www.baidu.com/s?wd=",searApi_weizui:"",color:"#38F"},
            //     {Marchine_name:"谷歌",button_value:"谷歌一下",searApi:"https://www.google.com/#q=",searApi_weizui:"",color:"#3b78e7"},
            //     {Marchine_name:"搜狗",button_value:"搜狗搜索",searApi:"https://www.sogou.com/web?query=",searApi_weizui:"",color:"#ff5943"},
            //     {Marchine_name:"360搜索",button_value:"360搜",searApi:"https://www.so.com/s?ie=utf-8&fr=none&src=360sou_newhome&q=",searApi_weizui:"",color:"#19b955"},
            //     {Marchine_name:"必应搜索",button_value:"必应搜索",searApi:"https://www.bing.com/search?q=",searApi_weizui:"",color:"#1688b1"},
            //     {Marchine_name:"Github",button_value:"Github",searApi:"https://github.com/search?q=",searApi_weizui:"",color:"#00302e"},
            //     {Marchine_name:"知乎搜索",button_value:"知乎搜索",searApi:"https://www.zhihu.com/search?type=content&q=",searApi_weizui:"",color:"#0077e6"},
            //     {Marchine_name:"百度文库",button_value:"搜文库",searApi:"https://wk.baidu.com/search?word=",searApi_weizui:"",color:"#38F"},
            //     {Marchine_name:"图片搜索",button_value:"图片搜索",searApi:"http://image.so.com/i?q=",searApi_weizui:"&src=srp",color:"#19b955"},
            //     {Marchine_name:"贴吧",button_value:"贴吧搜索",searApi:"https://tieba.baidu.com/f?kw=",searApi_weizui:"",color:"#38F"},
            //     {Marchine_name:"知道",button_value:"百度知道",searApi:"https://zhidao.baidu.com/search?word=",searApi_weizui:"",color:"#38F"},
            //     {Marchine_name:"网盘",button_value:"搜网盘",searApi:"http://www.panduoduo.net/s/name/",searApi_weizui:"",color:"#3f51b5"},
            //     {Marchine_name:"csdn",button_value:"搜csdn",searApi:"http://so.csdn.net/so/search/s.do?q=",searApi_weizui:"",color:"#be1a21"},
            // ],
        }
    }

    debounceGetSug = undefined;

    Search(){
        let device = this.props.device;
        // let marchine = this.state.Marchinelist[this.state.Marchineselect_index];
        if(linkPattern.test(this.state.keyWord)){
            if(device==='phone'){
                window.location.href = this.state.keyWord;
            }else{
                window.open(this.state.keyWord);
            }
        }
        let marchine = Marchinelist[this.props.selectMcIndex];
        
        let url = marchine.searApi + encodeURIComponent(this.state.keyWord) + marchine.searApi_weizui;
        if (device==='phone'){
            window.location.href = url;
        }else {
            window.open(url);
        }

    }

    GetSug(){
        if (this.state.keyWord===''){
            this.setState({
                sug:[],
                // showSug:false
            });
            this.props.setSugShow(false);
            return;
        }

        jsonp(SUGTIP+this.state.keyWord,{
            param:'cb'
        },(err, data)=>{
            // console.log("gyghvh",data.s)
            let sug;
            try {
                sug = data.s;
            }catch (e) {
                sug = [];
            }

            sug.splice(0,0,this.state.keyWord);
            console.log(sug);
            if (this.state.keyWord===''){
                this.setState({
                    sug:[],
                    // showSug:false
                });
                this.props.setSugShow(false)
            }else {
                this.setState({
                    sug:sug,
                    // showSug:true
                });
                this.props.setSugShow(true)
            }

        });
        this.setState({
            sugSelectIndex:0
        });

    }

    switchSug(){
        console.log("switch");
        let newshowSug = !this.props.sug;
        // this.setState({
        //     showMarchine:false
        // });
        this.props.setMarchineShow(false);
        if (newshowSug===true){
            console.log("judge");
            this.GetSug();
            return;
        }
        // this.setState({
        //     showSug:newshowSug
        // })
        this.props.setSugShow(newshowSug)
    }

    render() {

        console.log("HeadBar刷新了");

        if(!this.debounceGetSug){
            this.debounceGetSug = debounce(this.GetSug,200);
        }

        console.log(this.props);

        let Scrolled = this.props.Scrolled;
        // let color = this.state.Marchinelist[this.state.Marchineselect_index].color;
        // let name = this.state.Marchinelist[this.state.Marchineselect_index].button_value;

        let color = Marchinelist[this.props.selectMcIndex].color;
        let name = Marchinelist[this.props.selectMcIndex].button_value;

        let headBase = this.props.device!=='phone'?'headBar headBarHoverbel':'headBar';

        return(
            <div className={Scrolled?headBase+' gy-shadow-2':headBase} onClick={()=>{
                console.log("关闭sug");
                // this.setState({
                //     showSug:false,
                //     showMarchine:false
                // })
                this.props.setMarchineShow(false);
                this.props.setSugShow(false);
            }}>
                <div className={'sear_wrap'} ref={'wrap'} style={{borderColor:color}}>
                    <div className={'sear_marchine'}>
                        <ExpandMoreIcon fontSize={'inherit'} style={{fontSize:15}} onClick={(e)=>{
                            // let showMarchine = !this.state.showMarchine;
                            // this.setState({
                            //     showMarchine:showMarchine
                            // });
                            let marchine = this.props.marchine;
                            this.props.setMarchineShow(!marchine);
                            this.props.setSugShow(false);
                            e.stopPropagation();
                        }}/>

                        <Collapse in={this.props.marchine} component={'ul'} id={'sear_marchine_select'} className={'sug'}>
                            {Marchinelist.map((item,index)=>{
                                return (
                                    <a key={JSON.stringify(item)} className={this.props.selectMcIndex===index?'selected':''} onClick={()=>{
                                        // this.setState({
                                        //     Marchineselect_index:index,
                                        //     // showMarchine:false
                                        // });
                                        this.props.setMarchineIndex(index);
                                        this.props.setMarchineShow(false)
                                    }} style={{textDecoration: 'none',fontSize:14}}>{item.Marchine_name}</a>
                                )
                            })}
                        </Collapse>

                        {/*{this.props.marchine&&(*/}
                        {/*    */}
                        {/*    <ul id={'sear_marchine_select'} className={'sug'}>*/}
                        {/*        {Marchinelist.map((item,index)=>{*/}
                        {/*            return (*/}
                        {/*                <a className={this.props.selectMcIndex===index?'selected':''} onClick={()=>{*/}
                        {/*                    // this.setState({*/}
                        {/*                    //     Marchineselect_index:index,*/}
                        {/*                    //     // showMarchine:false*/}
                        {/*                    // });*/}
                        {/*                    this.props.setMarchineIndex(index);*/}
                        {/*                    this.props.setMarchineShow(false)*/}
                        {/*                }} style={{textDecoration: 'none',fontSize:14}}>{item.Marchine_name}</a>*/}
                        {/*            )*/}
                        {/*        })}*/}
                        {/*    </ul>*/}
                        {/*)}*/}
                    </div>
                    <div id={'seacing_bar'} ref={'Bar'}>
                        <input
                            id={'input_bar'} type={'text'}
                            placeholder={'搜你所想'}
                            autoComplete={'off'}
                            onClick={(e)=>{
                                this.switchSug();
                                e.stopPropagation();
                            }}
                            onKeyDown={(e)=>{
                                console.log(e.keyCode);//上为38，下为40

                                if (e.keyCode===38){
                                    let selectIndex = this.state.sugSelectIndex;
                                    let sug = this.state.sug;
                                    selectIndex = (sug.length + --selectIndex)%sug.length;
                                    this.setState({
                                        sugSelectIndex:selectIndex,
                                        keyWord:sug[selectIndex]
                                    })
                                }else if (e.keyCode===40){
                                    let selectIndex = this.state.sugSelectIndex;
                                    let sug = this.state.sug;
                                    // selectIndex = (sug.length + --selectIndex)%sug.length;
                                    selectIndex = ++selectIndex%sug.length;
                                    this.setState({
                                        sugSelectIndex:selectIndex,
                                        keyWord:sug[selectIndex]
                                    })
                                }else if (e.keyCode===13){
                                    if (this.state.keyWord==='')return;
                                    this.Search()
                                }
                            }}
                            // onKeyUp={()=>{

                            // }}
                            value={this.state.keyWord}
                            onChange={(e)=>{
                                this.setState({
                                    keyWord:e.target.value
                                },()=>{
                                    if (this.state.keyWord===''){
                                        this.setState({
                                            sug:[],
                                            // showSug:false
                                        });
                                        this.props.setSugShow(false);
                                        return;
                                    }
                                    //this.GetSug();
                                    //debounceGetsug();
                                    this.debounceGetSug();
                                });
                                // console.log(e.target.value)
                            }}
                        ref={'keyWordInput'}/>

                        {this.state.keyWord&&(
                            <div style={{display:'flex',alignItems:'center'}} onClick={()=>{
                                this.setState({
                                    keyWord:'',
                                    sug:[],
                                });
                                this.refs.keyWordInput.focus();
                                // console.log(this.refs.wrap.clientWidth-this.refs.searchBtn.clientWidth)
                            }}>
                                <CancelIcon fontSize={'inherit'} style={{fontSize:15}}/>
                            </div>
                        )}

                    </div>

                    {this.state.sug.length!==0&&this.props.sug?(
                        <ul className={'sug'} style={{width:this.refs.wrap&&this.refs.searchBtn?this.refs.wrap.clientWidth-this.refs.searchBtn.clientWidth:0}}>
                            {this.state.sug.map((item,index)=>{
                                if (index===0) return null;
                                return(
                                    <a key={index} className={index===this.state.sugSelectIndex?'selected':''} style={{textDecoration: 'none'}} onClick={()=>{
                                        this.setState({
                                            keyWord:item
                                        },()=>{
                                            this.Search()
                                        })
                                    }}>
                                        <div className={'sugindex'} style={{backgroundColor:index>3?"#afaea0":"#3b4042"}}>{index}</div>
                                        {item}
                                    </a>
                                )
                            })}
                        </ul>
                    ):null}
                    <div id={'seaching'} ref={'searchBtn'} className={'gy-button'} style={{backgroundColor:color}} onClick={()=>this.Search()}>{name}</div>
                </div>
            </div>
        )
    }
}


const mapStateToProps = ({Device,Show,MarchineIndex}) => ({
    device: Device.device,
    marchine:Show.marchine,
    sug:Show.sug,
    selectMcIndex:MarchineIndex.index
});

const mapDispatchToProps = { setSugShow,setMarchineShow ,setMarchineIndex};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(HeadBar);
