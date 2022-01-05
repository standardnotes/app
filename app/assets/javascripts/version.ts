/** Declared in webpack config */
declare const __VERSION__: string;
declare const __DESKTOP__: boolean;
declare const __WEB__: boolean;

export const WebAppVersion = __VERSION__;
export const IsDesktopPlatform = __DESKTOP__;
export const IsWebPlatform = __WEB__;
