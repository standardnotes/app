import { FileItem } from '@standardnotes/snjs'

export enum UploadedFileItemActionType {
  AttachFileToNote,
  DetachFileToNote,
  DeleteFile,
  ShareFile,
  DownloadFile,
  RenameFile,
  ToggleFileProtection,
  PreviewFile,
}

export type UploadedFileItemAction = {
  type: UploadedFileItemActionType
  payload: FileItem
}
