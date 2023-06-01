import { KeyParamsOrigination, ProtocolVersion } from '@standardnotes/common'
import {
  BackupFile,
  DecryptedPayloadInterface,
  EncryptedPayloadInterface,
  VaultKeyCopyContentSpecialized,
  ItemContent,
  ItemsKeyInterface,
  RootKeyInterface,
  VaultItemsKeyInterface,
} from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'
import { SNRootKeyParams } from '../../Keys/RootKey/RootKeyParams'
import { KeyedDecryptionSplit } from '../../Split/KeyedDecryptionSplit'
import { KeyedEncryptionSplit } from '../../Split/KeyedEncryptionSplit'
import { ItemAuthenticatedData } from '../../Types/ItemAuthenticatedData'
import { LegacyAttachedData } from '../../Types/LegacyAttachedData'
import { RootKeyEncryptedAuthenticatedData } from '../../Types/RootKeyEncryptedAuthenticatedData'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export interface EncryptionProviderInterface {
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
  supportedVersions(): ProtocolVersion[]
  isVersionNewerThanLibraryVersion(version: ProtocolVersion): boolean
  platformSupportsKeyDerivation(keyParams: SNRootKeyParams): boolean
  computeWrappingKey(passcode: string): Promise<RootKeyInterface>
  getUserVersion(): ProtocolVersion | undefined
  decryptBackupFile(
    file: BackupFile,
    password?: string,
  ): Promise<ClientDisplayableError | (EncryptedPayloadInterface | DecryptedPayloadInterface)[]>
  hasAccount(): boolean
  decryptErroredPayloads(): Promise<void>
  deleteWorkspaceSpecificKeyStateFromDevice(): Promise<void>
  hasPasscode(): boolean
  createRootKey(
    identifier: string,
    password: string,
    origination: KeyParamsOrigination,
    version?: ProtocolVersion,
  ): Promise<RootKeyInterface>

  getDecryptedPrivateKey(): string
  createVaultItemsKey(uuid: string, vaultSystemIdentifier: string): VaultItemsKeyInterface
  createVaultKeyContent(params: { vaultSystemIdentifier: string; vaultName: string }): VaultKeyCopyContentSpecialized
  generateKeyPair(): PkcKeyPair

  encryptPrivateKeyWithRootKey(rootKey: RootKeyInterface, privateKey: string): string
  decryptPrivateKeyWithRootKey(rootKey: RootKeyInterface, encryptedPrivateKey: string): string | undefined

  encryptVaultKeyContentWithRecipientPublicKey(
    content: VaultKeyCopyContentSpecialized,
    senderPrivateKey: string,
    recipientPublicKey: string,
  ): string
  decryptVaultKeyContentWithPrivateKey(
    encryptedVaultKeyContent: string,
    senderPublicKey: string,
    privateKey: string,
  ): VaultKeyCopyContentSpecialized | undefined

  setNewRootKeyWrapper(wrappingKey: RootKeyInterface): Promise<void>
  removePasscode(): Promise<void>
  validateAccountPassword(password: string): Promise<
    | {
        valid: true
        artifacts: {
          rootKey: RootKeyInterface
        }
      }
    | {
        valid: boolean
      }
  >
  createNewItemsKeyWithRollback(): Promise<() => Promise<void>>
  reencryptItemsKeys(): Promise<void>
  reencryptVaultItemsKeysForVault(vaultSystemIdentifier: string): Promise<void>
  getSureDefaultItemsKey(): ItemsKeyInterface
  getRootKeyParams(): Promise<SNRootKeyParams | undefined>
  getEmbeddedPayloadAuthenticatedData(
    payload: EncryptedPayloadInterface,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData | undefined
}
