class EventEmitter{
    constructor(){
        this.events = {};
    }

    on(event,callBack){
        let callBacks = this.events[event]||[];
        callBacks.push(callBack);
        this.events[event] = callBacks;
    }

    off(event,callBack){
        let callBacks = this.events[event]||[];
        this.events[event] = callBacks.filters(item=>item!==callBack);
        // this.events[event] = callBacks;
    }
    emit(event,data){
        data = data||[];
        let callBacks = this.events[event]||[];
        callBacks.forEach(callb => {
            callb(...data);
        });
    }

    once(event,callBack){
        let func = function(){
            callBack(...arguments);
            this.off(event,func);
        }
        this.on(event,func);
    }
}

const eventBus = new EventEmitter();

export default eventBus