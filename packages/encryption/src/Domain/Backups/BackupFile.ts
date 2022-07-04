import { BackupFileDecryptedContextualPayload, BackupFileEncryptedContextualPayload } from '@standardnotes/models'
import { AnyKeyParamsContent, ProtocolVersion } from '@standardnotes/common'

export type BackupFile = {
  version?: ProtocolVersion
  keyParams?: AnyKeyParamsContent
  auth_params?: AnyKeyParamsContent
  items: (BackupFileDecryptedContextualPayload | BackupFileEncryptedContextualPayload)[]
}

export enum BackupFileType {
  Encrypted = 'Encrypted',

  /**
   * Generated when an export is made from an application with no account and no passcode. The
   * items are encrypted, but the items keys are not.
   */
  EncryptedWithNonEncryptedItemsKey = 'EncryptedWithNonEncryptedItemsKey',

  FullyDecrypted = 'FullyDecrypted',

  Corrupt = 'Corrupt',
}
