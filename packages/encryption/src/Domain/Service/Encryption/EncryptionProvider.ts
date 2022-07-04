import { ProtocolVersion } from '@standardnotes/common'
import {
  DecryptedPayloadInterface,
  EncryptedPayloadInterface,
  ItemContent,
  RootKeyInterface,
} from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'
import { BackupFile } from '../../Backups/BackupFile'
import { SNRootKeyParams } from '../../Keys/RootKey/RootKeyParams'
import { KeyedDecryptionSplit, KeyedEncryptionSplit } from '../../Split/EncryptionSplit'

export interface EncryptionProvider {
  encryptSplitSingle(split: KeyedEncryptionSplit): Promise<EncryptedPayloadInterface>

  encryptSplit(split: KeyedEncryptionSplit): Promise<EncryptedPayloadInterface[]>

  decryptSplitSingle<
    C extends ItemContent = ItemContent,
    P extends DecryptedPayloadInterface<C> = DecryptedPayloadInterface<C>,
  >(
    split: KeyedDecryptionSplit,
  ): Promise<P | EncryptedPayloadInterface>

  decryptSplit<
    C extends ItemContent = ItemContent,
    P extends DecryptedPayloadInterface<C> = DecryptedPayloadInterface<C>,
  >(
    split: KeyedDecryptionSplit,
  ): Promise<(P | EncryptedPayloadInterface)[]>

  hasRootKeyEncryptionSource(): boolean

  getKeyEmbeddedKeyParams(key: EncryptedPayloadInterface): SNRootKeyParams | undefined

  computeRootKey(password: string, keyParams: SNRootKeyParams): Promise<RootKeyInterface>

  /**
   * @returns The versions that this library supports.
   */
  supportedVersions(): ProtocolVersion[]

  getUserVersion(): ProtocolVersion | undefined

  /**
   * Decrypts a backup file using user-inputted password
   * @param password - The raw user password associated with this backup file
   */
  decryptBackupFile(
    file: BackupFile,
    password?: string,
  ): Promise<ClientDisplayableError | (EncryptedPayloadInterface | DecryptedPayloadInterface)[]>
}
