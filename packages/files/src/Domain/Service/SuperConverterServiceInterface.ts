export interface SuperConverterServiceInterface {
  isValidSuperString(superString: string): boolean
  convertSuperStringToOtherFormat: (superString: string, toFormat: 'txt' | 'md' | 'html' | 'json') => string
  convertOtherFormatToSuperString: (otherFormatString: string, fromFormat: 'txt' | 'md' | 'html' | 'json') => string
  getEmbeddedFileIDsFromSuperString(superString: string): string[]
}
