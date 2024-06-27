export default function throttle(fn, delay) {
  let valid = true;
  return function () {
    if (!valid) {
      return false;
    }
    // 工作时间，执行函数并且在间隔期内把状态位设为无效
    valid = false;
    setTimeout(() => {
      fn();
      valid = true;
    }, delay);
  };
}
