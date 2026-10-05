import { GetTokenStore } from './localStorageUtil';
import { GetPartData } from './Api';
import { post } from './http';
import { appStore } from '../store/AppStore';
import { syncDeviceId } from './syncDevice';

type UpdateMessage = {
  type: 'data-updated';
  sourceDeviceId: string;
  changed: 'partData' | 'popularSites';
};

const getWebSocketUrl = (token: string) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/sync?token=${encodeURIComponent(token)}&deviceId=${encodeURIComponent(syncDeviceId)}`;
};

export const connectUserSync = () => {
  const token = GetTokenStore();
  if (typeof token !== 'string' || !token) return () => undefined;

  let socket: WebSocket | null = null;
  let stopped = false;
  let reconnectTimer: number | undefined;
  let refreshInFlight = false;
  let refreshPending = false;

  const refreshData = async () => {
    if (stopped || GetTokenStore() !== token) return;
    if (refreshInFlight) {
      refreshPending = true;
      return;
    }
    refreshInFlight = true;
    try {
      const data = await post(GetPartData, {});
      if (stopped || GetTokenStore() !== token || !data?.result) return;

      const partData = JSON.parse(data.partData);
      appStore.setPartition(partData, true, false);

      const popularSites = data.popularSites
        ? typeof data.popularSites === 'string'
          ? JSON.parse(data.popularSites)
          : data.popularSites
        : null;
      if (Array.isArray(popularSites)) {
        appStore.setPopularSite(popularSites, true, false);
      }
    } catch (error) {
      console.error('同步账号数据失败', error);
    } finally {
      refreshInFlight = false;
      if (refreshPending) {
        refreshPending = false;
        void refreshData();
      }
    }
  };

  const connect = () => {
    if (stopped || GetTokenStore() !== token) return;
    socket = new WebSocket(getWebSocketUrl(token));
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as UpdateMessage;
        if (
          message.type === 'data-updated' &&
          message.sourceDeviceId !== syncDeviceId
        ) {
          void refreshData();
        }
      } catch (error) {
        console.error('解析账号同步消息失败', error);
      }
    };
    socket.onopen = () => { void refreshData(); };
    socket.onclose = () => {
      socket = null;
      if (!stopped) {
        reconnectTimer = window.setTimeout(connect, 3000);
      }
    };
    socket.onerror = () => socket?.close();
  };

  connect();

  return () => {
    stopped = true;
    if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
    socket?.close();
    socket = null;
  };
};
