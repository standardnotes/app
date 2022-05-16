import { WebApplication } from '@/UIModels/Application'

export const isHandlingFileDrag = (event: DragEvent, application: WebApplication) => {
  const items = event.dataTransfer?.items

  if (!items) {
    return false
  }

  return Array.from(items).some((item) => {
    const isFile = item.kind === 'file'
    const fileName = item.getAsFile()?.name || ''
    const isBackupMetadataFile = application.files.isFileNameFileBackupRelated(fileName)
    return isFile && !isBackupMetadataFile
  })
}

export const isHandlingBackupDrag = (event: DragEvent, application: WebApplication) => {
  const items = event.dataTransfer?.items

  if (!items) {
    return false
  }

  return Array.from(items).every((item) => {
    const isFile = item.kind === 'file'
    const fileName = item.getAsFile()?.name || ''
    const isBackupMetadataFile = application.files.isFileNameFileBackupRelated(fileName)
    return isFile && isBackupMetadataFile
  })
}
