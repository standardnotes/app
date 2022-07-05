import { AnyKeyParamsContent, ProtocolVersion } from '@standardnotes/common'
import { BackupFileDecryptedContextualPayload, BackupFileEncryptedContextualPayload } from '@standardnotes/models'

export type BackupFile = {
  version?: ProtocolVersion
  keyParams?: AnyKeyParamsContent
  auth_params?: AnyKeyParamsContent
  items: (BackupFileDecryptedContextualPayload | BackupFileEncryptedContextualPayload)[]
}
