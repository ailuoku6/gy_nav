export function injectScript() {
  const originPushState = history.pushState;
  const originReplaceState = history.replaceState;

  const notify = () => {};

  history.pushState = function (...args: any[]) {
    originPushState.apply(history, args);
    notify();
  };

  history.replaceState = function (...args: any[]) {
    originReplaceState.apply(history, args);
    notify();
  };

  window.addEventListener('popstate', notify);
}

export function execInject(newWindow: Window) {
  // newWindow.onload = () => {
  //   const script = newWindow.document.createElement('script');
  //   script.textContent = `(${injectScript.toString()})()`;

  //   console.log('inject!!', script.textContent);

  //   newWindow.document.head.appendChild(script);
  // };

  const script = newWindow.document.createElement('script');
  script.textContent = `(${injectScript.toString()})()`;

  console.log('inject!!', script.textContent);

  newWindow.document.head.appendChild(script);
}
