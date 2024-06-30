// eslint-disable-next-line @typescript-eslint/ban-types
const debounce = (func: Function, wait = 0) => {
  let timeout: NodeJS.Timeout | null = null;
  let args: any[] | undefined;
  function debounced(...arg: any[]) {
    args = arg;
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    // 以Promise的形式返回函数执行结果
    return new Promise((res, rej) => {
      timeout = setTimeout(async () => {
        try {
          // @ts-ignore
          const result = await func.apply(this, args);
          res(result);
          console.log('啊啊啊啊啊', timeout);
        } catch (e) {
          rej(e);
        }
      }, wait);
    });
  }
  // 允许取消
  function cancel() {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = null;
  }
  // 允许立即执行
  function flush() {
    cancel();
    // @ts-ignore
    return func.apply(this, args);
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
};

export default debounce;
