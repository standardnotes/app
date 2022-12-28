import { DecryptedTransferPayload } from '@standardnotes/snjs'

export type ImportModalAvailableServices = 'evernote' | 'google-keep' | 'simplenote' | 'aegis'

export type ImportModalFile =
  | { file: File; status: 'pending' }
  | { file: File; status: 'success'; payloads: DecryptedTransferPayload[] }
  | { file: File; status: 'error'; error: Error }

export type ImportModalState = {
  files: ImportModalFile[]
  selectedService: ImportModalAvailableServices | undefined
}

export type ImportModalAction =
  | { type: 'setFiles'; files: File[] }
  | { type: 'updateFile'; file: ImportModalFile }
  | { type: 'setSelectedService'; selectedService: ImportModalAvailableServices }
