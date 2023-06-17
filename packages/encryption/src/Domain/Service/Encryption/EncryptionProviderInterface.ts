import { AsymmetricSignatureVerificationDetachedResult } from './../../Operator/AsymmetricSignatureVerificationDetachedResult'
import { KeyParamsOrigination, ProtocolVersion } from '@standardnotes/common'
import {
  BackupFile,
  DecryptedPayloadInterface,
  EncryptedPayloadInterface,
  ItemContent,
  ItemsKeyInterface,
  RootKeyInterface,
  KeySystemIdentifier,
  KeySystemItemsKeyInterface,
  AsymmetricMessagePayload,
  KeySystemRootKeyInterface,
  KeySystemRootKeyParamsInterface,
} from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'
import { SNRootKeyParams } from '../../Keys/RootKey/RootKeyParams'
import { KeyedDecryptionSplit } from '../../Split/KeyedDecryptionSplit'
import { KeyedEncryptionSplit } from '../../Split/KeyedEncryptionSplit'
import { ItemAuthenticatedData } from '../../Types/ItemAuthenticatedData'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { PublicKeySet } from '../../Operator/PublicKeySet'
import { KeySystemKeyManagerInterface } from '../KeySystemKeyManagerInterface'
import { AsymmetricallyEncryptedString } from '../../Operator/Types'

export type AsymmetricallyDecryptMessageResult = {
  message: AsymmetricMessagePayload
  senderPublicKey: string
  signing: {
    builtInSignaturePasses: boolean
    builtInSignaturePublicKey: string
    trustedSenderVerificationPerformed: boolean
    trustedSenderSignaturePasses: boolean
  }
}

export interface EncryptionProviderInterface {
  keys: KeySystemKeyManagerInterface

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

  getEmbeddedPayloadAuthenticatedData<D extends ItemAuthenticatedData>(
    payload: EncryptedPayloadInterface,
  ): D | undefined
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

  createNewItemsKeyWithRollback(): Promise<() => Promise<void>>
  reencryptItemsKeys(): Promise<void>
  getSureDefaultItemsKey(): ItemsKeyInterface

  createRandomizedKeySystemRootKey(dto: { systemIdentifier: KeySystemIdentifier }): KeySystemRootKeyInterface

  createUserInputtedKeySystemRootKey(dto: {
    systemIdentifier: KeySystemIdentifier
    userInputtedPassword: string
  }): KeySystemRootKeyInterface

  deriveUserInputtedKeySystemRootKey(dto: {
    keyParams: KeySystemRootKeyParamsInterface
    userInputtedPassword: string
  }): KeySystemRootKeyInterface

  createKeySystemItemsKey(
    uuid: string,
    keySystemIdentifier: KeySystemIdentifier,
    sharedVaultUuid: string | undefined,
    rootKeyToken: string,
  ): KeySystemItemsKeyInterface

  reencryptKeySystemItemsKeysForVault(keySystemIdentifier: KeySystemIdentifier): Promise<void>

  getKeyPair(): PkcKeyPair
  getSigningKeyPair(): PkcKeyPair

  asymmetricallyEncryptMessage(dto: {
    message: AsymmetricMessagePayload
    senderKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
    recipientPublicKey: string
  }): string
  asymmetricallyDecryptMessage(dto: {
    encryptedString: string
    trustedSenderPublicKey: string | undefined
    trustedSenderSigningPublicKey: string | undefined
    privateKey: string
  }): AsymmetricallyDecryptMessageResult | undefined
  asymmetricSignatureVerifyDetached(
    encryptedString: AsymmetricallyEncryptedString,
  ): AsymmetricSignatureVerificationDetachedResult
  getSenderPublicKeySetFromAsymmetricallyEncryptedString(string: string): PublicKeySet
}
