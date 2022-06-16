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
        | PopoverFileItemActionType.RenameFile
        | PopoverFileItemActionType.ToggleFileProtection
        | PopoverFileItemActionType.PreviewFile
      >
      payload: {
        file: FileItem
      }
    }
  | {
      type: PopoverFileItemActionType.ToggleFileProtection
      payload: {
        file: FileItem
      }
      callback: (isProtected: boolean) => void
    }
  | {
      type: PopoverFileItemActionType.RenameFile
      payload: {
        file: FileItem
        name: string
      }
    }
  | {
      type: PopoverFileItemActionType.PreviewFile
      payload: {
        file: FileItem
        otherFiles: FileItem[]
      }
    }
