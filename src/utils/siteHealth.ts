export type SiteHealthStatus = 'unknown' | 'ok' | 'fail';

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
