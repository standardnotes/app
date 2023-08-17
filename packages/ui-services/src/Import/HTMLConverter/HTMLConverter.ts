import { GenerateUuid } from '@standardnotes/services'

export class HTMLConverter {
  constructor(_generateUuid: GenerateUuid) {}

  static isHTMLFile(file: File): boolean {
    return file.type === 'text/html'
  }
}
