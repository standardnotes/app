import { ValetTokenOperation } from '../Temp/ValetTokenOperation'

export type CreateValetTokenPayload = {
  operation: ValetTokenOperation
  resources: Array<{
    remoteIdentifier: string
    unencryptedFileSize?: number
  }>
}
