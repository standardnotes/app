import { KeyParamsOrigination, ProtocolVersion } from '@standardnotes/common'
import {
  BackupFile,
  DecryptedPayloadInterface,
  EncryptedPayloadInterface,
  KeySystemRootKeyContentSpecialized,
  ItemContent,
  ItemsKeyInterface,
  RootKeyInterface,
  KeySystemIdentifier,
  KeySystemItemsKeyInterface,
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
  getDecryptedSigningPrivateKey(): string

  createKeySystemItemsKey(uuid: string, keySystemIdentifier: KeySystemIdentifier): KeySystemItemsKeyInterface
  createKeySystemRootKeyContent(params: {
    systemIdentifier: KeySystemIdentifier
    systemName: string
  }): KeySystemRootKeyContentSpecialized

  generateKeyPair(): PkcKeyPair
  generateSigningKeyPair(): PkcKeyPair

  encryptPrivateKeyWithRootKey(rootKey: RootKeyInterface, privateKey: string): string
  decryptPrivateKeyWithRootKey(rootKey: RootKeyInterface, encryptedPrivateKey: string): string | undefined

  encryptKeySystemRootKeyContentWithRecipientPublicKey(
    content: KeySystemRootKeyContentSpecialized,
    senderPrivateKey: string,
    recipientPublicKey: string,
  ): string
  decryptKeySystemRootKeyContentWithPrivateKey(
    encryptedKeySystemRootKeyContent: string,
    senderPublicKey: string,
    privateKey: string,
  ): KeySystemRootKeyContentSpecialized | undefined

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
  reencryptKeySystemItemsKeysForVault(keySystemIdentifier: KeySystemIdentifier): Promise<void>
  getSureDefaultItemsKey(): ItemsKeyInterface
  getRootKeyParams(): Promise<SNRootKeyParams | undefined>
  getEmbeddedPayloadAuthenticatedData(
    payload: EncryptedPayloadInterface,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData | undefined
}
