import { DecryptedTransferPayload } from '@standardnotes/snjs'
import { NoteImportType } from '@standardnotes/ui-services'

type ImportModalFileCommon = {
  id: string
  file: File
  service: NoteImportType | undefined
}

export type ImportModalFile =
  | ({ status: 'pending' } & ImportModalFileCommon)
  | ({
      status: 'success'
      payloads: DecryptedTransferPayload[]
    } & ImportModalFileCommon)
  | ({ status: 'error'; error: Error } & ImportModalFileCommon)

export type ImportModalState = {
  files: ImportModalFile[]
  selectedService: NoteImportType | undefined
}

export type ImportModalAction =
  | { type: 'setFiles'; files: File[]; service?: NoteImportType }
  | { type: 'updateFile'; file: ImportModalFile }
  | { type: 'setSelectedService'; selectedService: NoteImportType }
