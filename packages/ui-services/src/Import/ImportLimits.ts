export const MaxImportFileSizeBytes = 50 * 1_000_000

export function assertImportFileWithinSizeLimit(file: File): void {
  if (file.size > MaxImportFileSizeBytes) {
    throw new Error('Import file is too large')
  }
}
