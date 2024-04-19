import { FileItem, PrefKey, PrefValue } from '@standardnotes/models'

export type SuperConverterHTMLOptions = {
  addLineBreaks?: boolean
}

export interface SuperConverterServiceInterface {
  isValidSuperString(superString: string): boolean
  convertSuperStringToOtherFormat: (
    superString: string,
    toFormat: 'txt' | 'md' | 'html' | 'json' | 'pdf',
    config?: {
      embedBehavior?: PrefValue[PrefKey.SuperNoteExportEmbedBehavior]
      getFileItem?: (id: string) => FileItem | undefined
      getFileBase64?: (id: string) => Promise<string | undefined>
      pdf?: {
        pageSize?: PrefValue[PrefKey.SuperNoteExportPDFPageSize]
      }
    },
  ) => Promise<string>
  convertOtherFormatToSuperString: (
    otherFormatString: string,
    fromFormat: 'txt' | 'md' | 'html' | 'json',
    options?: {
      html?: SuperConverterHTMLOptions
    },
  ) => string
  getEmbeddedFileIDsFromSuperString(superString: string): string[]
}
