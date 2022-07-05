import { BackupFileDecryptedContextualPayload, BackupFileEncryptedContextualPayload } from '@standardnotes/models'
import { AnyKeyParamsContent, ProtocolVersion } from '@standardnotes/common'

export type BackupFile = {
  version?: ProtocolVersion
  keyParams?: AnyKeyParamsContent
  auth_params?: AnyKeyParamsContent
  items: (BackupFileDecryptedContextualPayload | BackupFileEncryptedContextualPayload)[]
}
