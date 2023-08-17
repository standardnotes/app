export interface SuperConverterServiceInterface {
  isValidSuperString(superString: string): boolean
  convertString: (superString: string, toFormat: 'txt' | 'md' | 'html' | 'json') => string
}
