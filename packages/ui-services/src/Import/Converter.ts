export interface Converter {
  getImportType(): string

  getSupportedFileTypes?: () => string[]
  getFileExtension?: () => string

  isContentValid: (content: string) => boolean
}
