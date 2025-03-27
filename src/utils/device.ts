export function isSafari() {
  const userAgent = navigator.userAgent;
  return (
    userAgent.includes('Safari') &&
    !userAgent.includes('Chrome') &&
    !userAgent.includes('CriOS')
  );
}
