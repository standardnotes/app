/** Declared in webpack config */
declare const __VERSION__: string

export const WebAppVersion = __VERSION__
export const IsDesktopPlatform = window.electronRemoteBridge != undefined
export const IsWebPlatform = window.electronRemoteBridge == undefined
