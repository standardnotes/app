import { ValetTokenOperation } from '@standardnotes/responses'

export type CreateVaultValetTokenParams = {
  vaultUuid: string
  fileUuid?: string
  remoteIdentifier: string
  operation: ValetTokenOperation
  unencryptedFileSize?: number
}
