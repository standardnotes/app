import { AnyKeyParamsContent, ProtocolVersion } from '@standardnotes/common'
import { BackupFileDecryptedContextualPayload } from './BackupFileDecryptedContextualPayload'
import { BackupFileEncryptedContextualPayload } from './BackupFileEncryptedContextualPayload'

export type BackupFile = {
  version?: ProtocolVersion
  keyParams?: AnyKeyParamsContent
  auth_params?: AnyKeyParamsContent
  items: (BackupFileDecryptedContextualPayload | BackupFileEncryptedContextualPayload)[]
}
