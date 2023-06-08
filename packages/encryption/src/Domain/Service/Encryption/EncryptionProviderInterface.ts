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
  AsymmetricMessagePayload,
} from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'
import { SNRootKeyParams } from '../../Keys/RootKey/RootKeyParams'
import { KeyedDecryptionSplit } from '../../Split/KeyedDecryptionSplit'
import { KeyedEncryptionSplit } from '../../Split/KeyedEncryptionSplit'
import { ItemAuthenticatedData } from '../../Types/ItemAuthenticatedData'
import { LegacyAttachedData } from '../../Types/LegacyAttachedData'
import { RootKeyEncryptedAuthenticatedData } from '../../Types/RootKeyEncryptedAuthenticatedData'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export type AsymmetricallyDecryptMessageResult = {
  message: AsymmetricMessagePayload
  signing: {
    builtInSignaturePasses: boolean
    builtInSignaturePublicKey: string
    trustedSenderVerificationPerformed: boolean
    trustedSenderSignaturePasses: boolean
  }
}

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

  getEmbeddedPayloadAuthenticatedData(
    payload: EncryptedPayloadInterface,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData | undefined
  getKeyEmbeddedKeyParamsFromItemsKey(key: EncryptedPayloadInterface): SNRootKeyParams | undefined

  supportedVersions(): ProtocolVersion[]
  isVersionNewerThanLibraryVersion(version: ProtocolVersion): boolean
  platformSupportsKeyDerivation(keyParams: SNRootKeyParams): boolean

  decryptBackupFile(
    file: BackupFile,
    password?: string,
  ): Promise<ClientDisplayableError | (EncryptedPayloadInterface | DecryptedPayloadInterface)[]>

  getUserVersion(): ProtocolVersion | undefined
  hasAccount(): boolean
  hasPasscode(): boolean
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

  decryptErroredPayloads(): Promise<void>
  deleteWorkspaceSpecificKeyStateFromDevice(): Promise<void>

  computeRootKey(password: string, keyParams: SNRootKeyParams): Promise<RootKeyInterface>
  computeWrappingKey(passcode: string): Promise<RootKeyInterface>
  hasRootKeyEncryptionSource(): boolean
  createRootKey<K extends RootKeyInterface>(
    identifier: string,
    password: string,
    origination: KeyParamsOrigination,
    version?: ProtocolVersion,
  ): Promise<K>
  getRootKeyParams(): SNRootKeyParams | undefined
  setNewRootKeyWrapper(wrappingKey: RootKeyInterface): Promise<void>

  createKeySystemItemsKey(uuid: string, keySystemIdentifier: KeySystemIdentifier): KeySystemItemsKeyInterface
  createKeySystemRootKeyContent(params: {
    systemIdentifier: KeySystemIdentifier
    systemName: string
  }): KeySystemRootKeyContentSpecialized

  createNewItemsKeyWithRollback(): Promise<() => Promise<void>>
  reencryptItemsKeys(): Promise<void>
  getSureDefaultItemsKey(): ItemsKeyInterface

  reencryptKeySystemItemsKeysForVault(keySystemIdentifier: KeySystemIdentifier): Promise<void>

  getKeyPair(): PkcKeyPair
  getSigningKeyPair(): PkcKeyPair

  asymmetricallyEncryptMessage(dto: {
    message: AsymmetricMessagePayload
    senderPrivateKey: string
    senderSigningKeyPair: PkcKeyPair
    recipientPublicKey: string
  }): string
  asymmetricallyDecryptMessage(dto: {
    encryptedString: string
    senderPublicKey: string
    trustedSenderSigningPublicKey: string | undefined
    privateKey: string
  }): AsymmetricallyDecryptMessageResult | undefined
  getSignerPublicKeyFromAsymmetricallyEncryptedString(string: string): string
}
