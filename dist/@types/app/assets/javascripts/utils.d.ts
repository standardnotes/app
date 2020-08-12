export declare const isDev: boolean;
export declare function getParameterByName(name: string, url: string): string | null;
export declare function isNullOrUndefined(value: any): boolean;
export declare function getPlatformString(): string;
export declare function dateToLocalizedString(date: Date): string;
/** Via https://davidwalsh.name/javascript-debounce-function */
export declare function debounce(this: any, func: any, wait: number, immediate?: boolean): () => void;
export declare function isDesktopApplication(): any;
