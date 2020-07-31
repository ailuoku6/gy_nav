import React from 'react';
import './index.css';
import Divider from '@material-ui/core/Divider';
import Grid from "@material-ui/core/Grid";
import {connect} from 'react-redux'

import {setPopularSite} from '../../redux/actions'


class PopularSite extends React.Component{

    // eslint-disable-next-line no-useless-constructor
    constructor(props){
        super(props);
        this.state = {
        }
    }

    render() {

        console.log("popular Site 刷新了");

        let pts = this.props.popularSite.pSite;

        return(
            <div className={'gy-container gy-shadow-2'}>
                <div className={'title'}>常用站点</div>
                <Divider/>
                <div className={'site-container'}>
                    {pts.map((item,index)=>{
                        return (
                            <div key={index}>
                                <li className={'gy-hoverable site'}>
                                    <a style={{textDecoration: 'none'}} href={item.url} target="_blank">
                                        <img className={'site-icon'} src={item.icon}/>
                                        <span className={'site-title'}>{item.site_name}</span>
                                    </a>
                                </li>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
}

const mapStateToProps = ({PopularSite})=>({
    popularSite:PopularSite
});

const mapDispatchToProps = {setPopularSite};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(PopularSite)
//export default PopularSite;
