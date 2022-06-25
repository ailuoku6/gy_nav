const HEADER_KEY = "nav_header";

export const authUtil = (function () {
  // 初始化拿值
  let header = localStorage.getItem(HEADER_KEY) || "";
  const getHeader = () => {
    return header;
  };
  const setHeader = (head: string) => {
    header = head;
    // 设置localstorage
    localStorage.setItem(HEADER_KEY, head);
  };
  return {
    getHeader,
    setHeader,
  };
})();
