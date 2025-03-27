class DoubleClick {
  private keys: { [key: number]: Date };

  constructor() {
    this.keys = {};
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  doubleClick(keyCode: number, callBack: Function, args: any[]) {
    args = args || [];
    const now = new Date();
    const lastTime = this.keys[keyCode];
    // @ts-ignore
    if (lastTime && now - lastTime < 200) {
      callBack(...args);
    }
    this.keys[keyCode] = now;
  }
}

const doubleClick = new DoubleClick();

export default doubleClick;
