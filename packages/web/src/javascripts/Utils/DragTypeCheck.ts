import { WebApplication } from '@/Application/WebApplication'

const isBackupRelatedFile = (item: DataTransferItem, application: WebApplication): boolean => {
  const fileName = item.getAsFile()?.name || ''
  const isBackupMetadataFile = application.files.isFileNameFileBackupRelated(fileName) !== false
  return isBackupMetadataFile
}

export const isHandlingFileDrag = (event: DragEvent, application: WebApplication) => {
  const items = event.dataTransfer?.items

  if (!items) {
    return false
  }

  return Array.from(items).some((item) => {
    return item.kind === 'file' && !isBackupRelatedFile(item, application)
  })
}

export const isHandlingBackupDrag = (event: DragEvent, application: WebApplication) => {
  const items = event.dataTransfer?.items

  if (!items) {
    return false
  }

  return Array.from(items).every((item) => {
    return item.kind === 'file' && isBackupRelatedFile(item, application)
  })
}
