import { FileItem } from '@standardnotes/snjs'

export enum PopoverFileItemActionType {
  AttachFileToNote,
  DetachFileToNote,
  DeleteFile,
  DownloadFile,
  RenameFile,
  ToggleFileProtection,
  PreviewFile,
}

export type PopoverFileItemAction =
  | {
      type: Exclude<
        PopoverFileItemActionType,
        PopoverFileItemActionType.RenameFile | PopoverFileItemActionType.ToggleFileProtection
      >
      payload: FileItem
    }
  | {
      type: PopoverFileItemActionType.ToggleFileProtection
      payload: FileItem
      callback: (isProtected: boolean) => void
    }
  | {
      type: PopoverFileItemActionType.RenameFile
      payload: {
        file: FileItem
        name: string
      }
    }
