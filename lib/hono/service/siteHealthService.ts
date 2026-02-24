import { Ctx } from '../types';

const MAX_URLS = 200;
const TIMEOUT_MS = 9000;
const CONCURRENCY = 6;

const normalizeUrl = (input: string): string => {
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

const isHttpProtocol = (protocol: string) =>
  protocol === 'http:' || protocol === 'https:';

const isReachableStatus = (status: number) => {
  if (status === 404) return false;
  if (status >= 500) return false;
  return true;
};

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    res.body?.cancel();
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const checkSingleUrl = async (rawUrl: string) => {
  const normalized = normalizeUrl(rawUrl);
  if (!normalized) return { url: '', status: 'fail' as const };

  const parsed = new URL(normalized);
  if (!isHttpProtocol(parsed.protocol)) {
    return { url: normalized, status: 'fail' as const };
  }

  const res = await fetchWithTimeout(normalized, TIMEOUT_MS);
  if (!res) {
    return { url: normalized, status: 'fail' as const };
  }

  return {
    url: normalized,
    status: isReachableStatus(res.status) ? ('ok' as const) : ('fail' as const),
  };
};

export default class SiteHealthService {
  public static async checkSiteHealth(ctx: Ctx) {
    try {
      const body = await ctx.req.parseBody();
      const { urls } = body as any;

      if (!urls) {
        return ctx.json({ result: false, msg: 'urls is required' }, 400);
      }

      let list: string[] = [];
      if (Array.isArray(urls)) {
        list = urls.map((item) => String(item));
      } else if (typeof urls === 'string') {
        try {
          const parsed = JSON.parse(urls);
          if (Array.isArray(parsed)) {
            list = parsed.map((item) => String(item));
          }
        } catch {
          list = urls.split(',').map((item) => item.trim());
        }
      }

      const normalized = list
        .map((item) => normalizeUrl(item))
        .filter((item) => !!item);
      const uniqueUrls = Array.from(new Set(normalized)).slice(0, MAX_URLS);

      if (!uniqueUrls.length) {
        return ctx.json({ result: true, total: 0, ok: 0, fail: 0, data: {} });
      }

      const results: Record<string, 'ok' | 'fail'> = {};
      let ok = 0;
      let fail = 0;
      let cursor = 0;
      const limit = Math.min(CONCURRENCY, uniqueUrls.length);

      const worker = async () => {
        while (cursor < uniqueUrls.length) {
          const current = uniqueUrls[cursor];
          cursor += 1;
          const res = await checkSingleUrl(current);
          if (res.url) {
            results[res.url] = res.status;
          }
          if (res.status === 'ok') {
            ok += 1;
          } else {
            fail += 1;
          }
        }
      };

      await Promise.all(Array.from({ length: limit }, () => worker()));

      return ctx.json({
        result: true,
        total: uniqueUrls.length,
        ok,
        fail,
        data: results,
      });
    } catch (error: any) {
      return ctx.json({ result: false, msg: error.message }, 500);
    }
  }
}
