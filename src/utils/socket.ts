import { io as IO, Socket } from "socket.io-client";

const localUrl = "ws://127.0.0.1:3001";

// 负责socket通信，并将事件暴露给react app
class SocketManager {
  private io: Socket;

  private eventHandlers: Map<string, ((...arg: any[]) => void)[]>;

  constructor() {
    this.io = IO(localUrl, { transports: ["websocket"] });
    this.eventHandlers = new Map();
    this.initEventListener();
  }

  // socket事件拦截，事件预处理，如401事件
  private interceptor() {}

  private initEventListener() {
    this.io.onAny((event: string, restArg: any[]) => {
      const callbacks = this.eventHandlers.get(event) || [];
      const data = restArg[0];
      callbacks.forEach((cb) => {
        cb(data);
      });
    });
  }

  public reconnect() {
    if (!this.io.connected) {
      this.io.connect();
    }
  }

  public disconnect() {
    this.io.disconnect();
  }

  // 注册监听事件
  public onMsg(event: string, callback: (...arg: any[]) => void) {
    const callbacks = this.eventHandlers.get(event) || [];
    callbacks.push(callback);
    this.eventHandlers.set(event, callbacks);

    const unsubscript = () => {
      const callbacks = (this.eventHandlers.get(event) || []).filter(
        (cb) => cb !== callback
      );
      this.eventHandlers.set(event, callbacks);
    };

    return unsubscript;
  }

  public sendMsg(event: string, data: any) {
    this.io.emit(event, data);
  }
}

const socketManager = new SocketManager();

export { socketManager };
