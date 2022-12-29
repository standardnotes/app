import { NoteImportType } from '@standardnotes/ui-services'

type ImportModalFileCommon = {
  id: string
  file: File
  service: NoteImportType | null | undefined
}

export type ImportModalFile = (
  | { status: 'pending' }
  | { status: 'ready' }
  | { status: 'parsing' }
  | { status: 'importing' }
  | { status: 'success'; successMessage: string }
  | { status: 'error'; error: Error }
) &
  ImportModalFileCommon

export type ImportModalState = {
  files: ImportModalFile[]
}

export type ImportModalAction =
  | { type: 'setFiles'; files: File[]; service?: NoteImportType }
  | { type: 'updateFile'; file: ImportModalFile }
  | { type: 'removeFile'; id: ImportModalFile['id'] }
  | { type: 'clearFiles' }
