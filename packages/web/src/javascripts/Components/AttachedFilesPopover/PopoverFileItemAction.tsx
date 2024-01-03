import { FileItem } from '@standardnotes/snjs'

export enum FileItemActionType {
  AttachFileToNote,
  DetachFileToNote,
  DeleteFile,
  DownloadFile,
  RenameFile,
  ToggleFileProtection,
  PreviewFile,
}

export type FileItemAction =
  | {
      type: Exclude<
        FileItemActionType,
        FileItemActionType.RenameFile | FileItemActionType.ToggleFileProtection | FileItemActionType.PreviewFile
      >
      payload: {
        file: FileItem
        directoryHandle?: FileSystemDirectoryHandle
      }
    }
  | {
      type: FileItemActionType.ToggleFileProtection
      payload: {
        file: FileItem
      }
      callback: (isProtected: boolean) => void
    }
  | {
      type: FileItemActionType.RenameFile
      payload: {
        file: FileItem
        name: string
      }
    }
  | {
      type: FileItemActionType.PreviewFile
      payload: {
        file: FileItem
        otherFiles?: FileItem[]
      }
    }
