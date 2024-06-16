export function isSafari() {
    var userAgent = navigator.userAgent;
    return userAgent.includes('Safari') && !userAgent.includes('Chrome') && !userAgent.includes('CriOS');
}