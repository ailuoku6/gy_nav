class DoubleClick{
    constructor(){
        this.keys = {};
    }

    doubleClick(keyCode,callBack,args){
        args = args||[];
        let now = new Date();
        let lastTime = this.keys[keyCode];
        if(lastTime&&(now-lastTime<200)){
            callBack(...args);
        }
        this.keys[keyCode] = now;
    }

}

const doubleClick = new DoubleClick();

export default doubleClick