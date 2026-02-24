export type SiteHealthStatus = 'unknown' | 'ok' | 'fail';

const isHttpProtocol = (protocol: string) =>
  protocol === 'http:' || protocol === 'https:';

export const normalizeSiteUrl = (input: string): string => {
  const trimmed = String(input || '').trim();
  if (!trimmed) return '';

  try {
    return new URL(trimmed).href;
  } catch {
    try {
      return new URL(`https://${trimmed}`).href;
    } catch {
      return '';
    }
  }
};

const toCheckUrl = (normalizedUrl: string): string => {
  try {
    const url = new URL(normalizedUrl);
    if (!isHttpProtocol(url.protocol)) return '';

    if (window.location.protocol === 'https:' && url.protocol === 'http:') {
      url.protocol = 'https:';
    }

    return url.href;
  } catch {
    return '';
  }
};

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(url, {
      mode: 'no-cors',
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
};

const imageWithTimeout = (url: string, timeoutMs: number) =>
  new Promise<boolean>((resolve) => {
    const img = new Image();
    let settled = false;

    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve(result);
    };

    const timer = window.setTimeout(() => finish(false), timeoutMs);

    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.referrerPolicy = 'no-referrer';
    img.src = url;
  });

const getFaviconUrl = (url: string) => {
  try {
    const u = new URL(url);
    u.pathname = '/favicon.ico';
    u.search = '';
    u.hash = '';
    return u.href;
  } catch {
    return '';
  }
};

export const checkSiteReachable = async (
  rawUrl: string,
  timeoutMs = 4500
): Promise<boolean> => {
  const normalized = normalizeSiteUrl(rawUrl);
  if (!normalized) return false;

  const checkUrl = toCheckUrl(normalized);
  if (!checkUrl) return false;

  const fetchOk = await fetchWithTimeout(checkUrl, timeoutMs);
  if (fetchOk) return true;

  const favicon = getFaviconUrl(checkUrl);
  if (!favicon) return false;

  return imageWithTimeout(`${favicon}?t=${Date.now()}`, timeoutMs);
};
