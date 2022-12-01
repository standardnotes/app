export type FileDownloadProgress = {
  encryptedFileSize: number
  encryptedBytesDownloaded: number
  encryptedBytesRemaining: number
  percentComplete: number
  source: 'network' | 'local' | 'memcache'
}

export function fileProgressToHumanReadableString(
  progress: FileDownloadProgress,
  fileName: string,
  options: { showPercent: boolean },
): string {
  const progressPercent = Math.floor(progress.percentComplete)

  const sourceString =
    progress.source === 'network' ? '' : progress.source === 'memcache' ? 'from cache' : 'from backup'

  let result = `Downloading file ${sourceString} "${fileName}"`

  if (options.showPercent) {
    result += ` (${progressPercent}%)`
  }

  return result
}
