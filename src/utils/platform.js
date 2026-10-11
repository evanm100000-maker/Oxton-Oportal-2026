export function isDesktopBrowser() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Check if it's a mobile device
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  
  // Check if it's running inside Electron
  const isElectron = userAgent.toLowerCase().indexOf('electron') > -1;
  
  // It's a desktop browser if it's NOT mobile and NOT Electron
  return !isMobile && !isElectron;
}
