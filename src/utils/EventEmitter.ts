/* eslint-disable @typescript-eslint/ban-types */
class EventEmitter {
  private events: { [key: string]: Array<Function> };

  constructor() {
    this.events = {};
  }

  on(event: string, callBack: Function) {
    const callBacks = this.events[event] || [];
    callBacks.push(callBack);
    this.events[event] = callBacks;
  }

  off(event: string, callBack: Function) {
    const callBacks = this.events[event] || [];
    this.events[event] = callBacks.filter((item) => item !== callBack);
    // this.events[event] = callBacks;
  }
  emit(event: string, data: any) {
    data = data || [];
    const callBacks = this.events[event] || [];
    callBacks.forEach((callb) => {
      callb(...data);
    });
  }

  once(event: string, callBack: Function) {
    const func = function () {
      // eslint-disable-next-line prefer-rest-params
      callBack(...arguments);
      // @ts-ignore
      this.off(event, func);
    };
    this.on(event, func);
  }
}

const eventBus = new EventEmitter();

export default eventBus;
