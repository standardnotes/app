export const PreviewableTextFileTypes = ['text/plain', 'application/json']

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
