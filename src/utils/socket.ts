import { io as IO, Socket } from "socket.io-client";

const localUrl = "ws://127.0.0.1:3001";

class SocketManager {
  private io: Socket;
  constructor() {
    this.io = IO(localUrl, { transports: ["websocket"] });
    console.info("-------socket_connnect");
  }
}

const socketManager = new SocketManager();

export { socketManager };
