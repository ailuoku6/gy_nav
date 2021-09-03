import React,{useState,useEffect} from 'react';
import Site from "../site";
//import './dark.css';
import { get } from '../../utils/http'
import {GetAllFS} from '../../utils/Api'

import {FriendSiteWrap} from './style'

export default function FriendSite(){
    const [sites,setSites] = useState<any>([]);

    useEffect(()=>{
        get(GetAllFS,{}).then((data:any)=>{
            if(data.result){
                setSites(data.fsites);
            }
        }).catch((err)=>{
            console.log(err);
        })
    },[]);

    return (
        <FriendSiteWrap>
            友情链接:
            <Site  Edit={false} Sites={sites}/>
        </FriendSiteWrap>
    )


}