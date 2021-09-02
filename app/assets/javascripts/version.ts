/** Declared in webpack config */
declare const __VERSION__: string;
declare const __DESKTOP__: boolean;
declare const __WEB__: boolean;

export const appVersion = __VERSION__;
export const isDesktopPlatform = __DESKTOP__;
export const isWebPlatform = __WEB__;
