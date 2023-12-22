export interface SuperConverterServiceInterface {
  isValidSuperString(superString: string): boolean
  convertSuperStringToOtherFormat: (superString: string, toFormat: 'txt' | 'md' | 'html' | 'json') => Promise<string>
  convertOtherFormatToSuperString: (
    otherFormatString: string,
    fromFormat: 'txt' | 'md' | 'html' | 'json',
    options?: {
      html?: {
        addLineBreaks?: boolean
      }
    },
  ) => string
  getEmbeddedFileIDsFromSuperString(superString: string): string[]
}
