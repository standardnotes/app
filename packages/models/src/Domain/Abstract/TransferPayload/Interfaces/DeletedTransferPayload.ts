import { TransferPayload } from './TransferPayload'

export interface DeletedTransferPayload extends TransferPayload {
  content: undefined
  deleted: true
}
