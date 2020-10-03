import React from 'react';
import './index.css';
import luntan from '../../assets/bbs.png'


class Footer extends React.Component{

    // eslint-disable-next-line no-useless-constructor
    constructor(props){
        super(props);
        this.state = {

        }
    }

    render() {
        return(
            <footer>
                <div className={'about'}>
                    <div className={'beian'}>
                        BY
                        <a href="http://weibo.com/ailuoku6" target="_blank">@爱咯酷6</a>
                        | 论坛:
                        <a href="http://bbs.ailuoku6.top" target="_blank">
                            <img alt={''} src={luntan}/>
                        </a>
                    </div>
                    <div className={'beian'}>
                        网站备案号:
                        <a href="http://www.beian.miit.gov.cn/" target="_blank">
                            桂ICP备18003700号
                        </a>
                    </div>
                    {/* <div>网站备案号:桂ICP备18003700号</div> */}
                </div>
            </footer>
        )
    }
}

export default Footer;
