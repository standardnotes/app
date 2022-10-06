export const PreviewableTextFileTypes = ['text/plain', 'text/csv', 'application/json']

export const RequiresNativeFilePreview = ['application/pdf']

export const isFileTypePreviewable = (fileType: string) => {
  const isImage = fileType.startsWith('image/')
  const isVideo = fileType.startsWith('video/')
  const isAudio = fileType.startsWith('audio/')
  const isPdf = fileType === 'application/pdf'
  const isText = PreviewableTextFileTypes.includes(fileType)

  if (isImage || isVideo || isAudio || isText || isPdf) {
    return true
  }

  return false
}
