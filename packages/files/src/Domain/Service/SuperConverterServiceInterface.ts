import { FileItem } from '@standardnotes/models'
import { GenerateUuid } from '@standardnotes/services'

export interface SuperConverterServiceInterface {
  isValidSuperString(superString: string): boolean
  convertSuperStringToOtherFormat: (superString: string, toFormat: 'txt' | 'md' | 'html' | 'json') => Promise<string>
  convertOtherFormatToSuperString: (otherFormatString: string, fromFormat: 'txt' | 'md' | 'html' | 'json') => string
  getEmbeddedFileIDsFromSuperString(superString: string): string[]
  uploadAndReplaceInlineFilesInSuperString(
    superString: string,
    uploadFile: (file: File) => Promise<FileItem | undefined>,
    linkFile: (file: FileItem) => Promise<void>,
    generateUuid: GenerateUuid,
  ): Promise<string>
}
