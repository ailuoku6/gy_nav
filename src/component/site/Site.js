import React from 'react';
import './index.css';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import ReactSortable from 'react-sortablejs'

import {connect} from 'react-redux'
import {addSite2Part,delSite,modifySite,moveSite} from '../../redux/actions'

import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Grid from "@material-ui/core/Grid";

import AddSiteDialog from "../GyDialog/AddSiteDialog"

class Site extends React.Component{

    // eslint-disable-next-line no-useless-constructor
    constructor(props) {
        super(props);
        this.state = {
            selectedIndex:-1
        }
    }
    render() {

        console.log("site刷新了");

        let sites = Array.isArray(this.props.Sites)?this.props.Sites:[];
        let edit = this.props.Edit&&this.props.PartIndex!==null;
        let partIndex = this.props.PartIndex!==undefined&&this.props.partIndex!==null?this.props.PartIndex:-1;
        let key = "PlaceHolderKey-"+(edit ? 'on' : 'off');
        let selectedIndex = this.state.selectedIndex;

        return(
            <div>
                <ReactSortable
                    key={key}
                    onChange={(order, sortable, evt)=>{
                        // if (!edit) return;
                        console.log("order",order);
                        console.log("sortable",sortable);
                        console.log("evt",evt.oldIndex);
                        // this.setState({
                        //     list:order
                        // })
                        if(partIndex<0) return;
                        this.props.moveSite(partIndex,evt.oldIndex,evt.newIndex);
                    }}
                    options={{
                        animation: 150,
                        easing: "cubic-bezier(1, 0, 0, 1)",
                        ghostClass: "sortable-ghost",
                        disabled:!edit
                    }}
                >
                    {sites.map((item,index)=>{
                        return(
                            <div className={'site-noicon gy-hoverable'} key={index} style={edit?{minWidth:40}:null}>
                                <a href={item.url?item.url:''} target={'_blank'}>{item.site_name?item.site_name:'网站名缺失'}</a>
                                {edit===true&&(
                                    <div className={'delMenu'}>
                                        <div style={{width:'50%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:5,borderRadius:5,backgroundColor:'#2525b1a1'}}
                                            onClick={()=>{
                                                this.setState({
                                                    selectedIndex:index
                                                })
                                            }}
                                        >
                                            <EditIcon fontSize={'small'} color={'inherit'} style={{color:'#fff'}}/>
                                        </div>
                                        <div style={{width:'50%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:5,borderRadius:5,backgroundColor:'#ff0000b8'}}
                                            onClick={()=>{
                                                this.props.delSite(partIndex,index);
                                            }}
                                        >
                                            <DeleteIcon fontSize={'small'} color={'inherit'} style={{color:'#fff'}}/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </ReactSortable>
                {selectedIndex>=0&&(
                    <AddSiteDialog
                        open={selectedIndex>=0}
                        title={'编辑站点'}
                        ConfirmText={'修改'}
                        defaultName={sites[selectedIndex].site_name}
                        defaultAddr={sites[selectedIndex].url}
                        onClose={()=>{
                            this.setState({
                                selectedIndex:-1
                            })
                        }}
                        onCancel={()=>{
                            this.setState({
                                selectedIndex:-1
                            })
                        }}
                        onConfirm={(siteName,siteAddr)=>{
                            if(siteName&&siteAddr){//这里应该加验证
                                //this.props.addSite2Part(this.state.selectedIndex,siteName,siteAddr);
                                this.props.modifySite(partIndex,selectedIndex,siteName,siteAddr);
                            }else{
                                console.log("给点东西吧");
                            }
                            this.setState({
                                selectedIndex:-1
                            })
                        }}
                    />
                )}
                
            </div>
            
        )
    }
}

const mapStateToProps = ({})=>({

})

const mapDispacthToProps = {addSite2Part,delSite,modifySite,moveSite};


export default connect(
    mapStateToProps,
    mapDispacthToProps
)(Site)

//export default Site;
