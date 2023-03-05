import { useEffect } from "react";
import { authUtil } from "utils/authStorage";
import { socketManager } from "utils/socket";

export default function useWebsocket() {
  useEffect(() => {
    // 注册socket事件
  }, []);

  useEffect(() => {
    console.info("--------socketmanager", socketManager);
  }, []);
}
