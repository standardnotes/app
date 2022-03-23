export const isFileTypePreviewable = (fileType: string) => {
  if (!fileType) {
    return false;
  }

  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');
  const isAudio = fileType.startsWith('audio/');
  const isPdf = fileType === 'application/pdf';

  if (isImage || isVideo || isAudio || isPdf) {
    return true;
  }

  return false;
};
