import { DurableObject } from 'cloudflare:workers';

export type UserSyncMessage = {
  type: 'data-updated';
  sourceDeviceId: string;
  changed: 'partData' | 'popularSites';
};

export class UserSyncDurableObject extends DurableObject {
  fetch(request: Request): Response {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected a WebSocket upgrade', { status: 426 });
    }

    const deviceId = new URL(request.url).searchParams.get('deviceId');
    if (!deviceId) {
      return new Response('Missing device id', { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server, [`device:${deviceId}`]);
    server.send(JSON.stringify({ type: 'ready' }));

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(message: UserSyncMessage): void {
    const payload = JSON.stringify(message);
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(payload);
      } catch {
        try { socket.close(1011, 'Unable to deliver update'); } catch { /* Already closed. */ }
      }
    }
  }

  webSocketMessage(): void {
    // The client only receives notifications. Ignore unexpected messages.
  }

  webSocketClose(socket: WebSocket, code: number, reason: string): void {
    socket.close(code, reason);
  }

  webSocketError(socket: WebSocket): void {
    socket.close(1011, 'Connection error');
  }
}
