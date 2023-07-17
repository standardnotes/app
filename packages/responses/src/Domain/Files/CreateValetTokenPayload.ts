import { ValetTokenOperation } from '@standardnotes/security'

export type CreateValetTokenPayload = {
  operation: ValetTokenOperation
  resources: Array<{
    remoteIdentifier: string
    unencryptedFileSize?: number
  }>
}
