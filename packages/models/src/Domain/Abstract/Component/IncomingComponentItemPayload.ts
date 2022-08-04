import { DecryptedTransferPayload } from '../TransferPayload/Interfaces/DecryptedTransferPayload'

export type IncomingComponentItemPayload = DecryptedTransferPayload & {
  clientData: Record<string, unknown>
}
