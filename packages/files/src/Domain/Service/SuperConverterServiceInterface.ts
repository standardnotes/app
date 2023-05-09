export interface SuperConverterServiceInterface {
  convertString: (superString: string, toFormat: 'txt' | 'md' | 'html' | 'json') => string
}
