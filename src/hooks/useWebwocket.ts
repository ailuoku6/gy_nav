import { useEffect } from "react";

import { socketManager } from "utils/socket";

export default function useWebsocket() {
  useEffect(() => {
    console.info("--------socketmanager", socketManager);
  }, []);
}
