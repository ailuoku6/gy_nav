import React from 'react';
import './index.css';


class MarginHead extends React.Component{

    // eslint-disable-next-line no-useless-constructor
    constructor(props){
        super(props);
        this.state = {

        }
    }

    render() {

        console.log("marginhead刷新了");

        return(
            <div className={'autoMargin'}>

            </div>
        )
    }
}

export default MarginHead;
