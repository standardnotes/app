/** Declared in webpack config */
declare const __WEB_VERSION__: string

export const WebAppVersion = __WEB_VERSION__
export const IsDesktopPlatform = window.electronRemoteBridge != undefined
export const IsWebPlatform = window.electronRemoteBridge == undefined
