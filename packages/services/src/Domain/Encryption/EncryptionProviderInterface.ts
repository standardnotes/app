import {
  AsymmetricSignatureVerificationDetachedResult,
  SNRootKeyParams,
  KeyedDecryptionSplit,
  KeyedEncryptionSplit,
  ItemAuthenticatedData,
  AsymmetricallyEncryptedString,
} from '@standardnotes/encryption'
import { KeyParamsOrigination, ProtocolVersion } from '@standardnotes/common'
import {
  DecryptedPayloadInterface,
  EncryptedPayloadInterface,
  ItemContent,
  ItemsKeyInterface,
  RootKeyInterface,
  KeySystemIdentifier,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  KeySystemRootKeyParamsInterface,
  PortablePublicKeySet,
} from '@standardnotes/models'

export interface EncryptionProviderInterface {
  initialize(): Promise<void>

  isPasscodeLocked(): Promise<boolean>

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

  getPasswordCreatedDate(): Date | undefined
  getEncryptionDisplayName(): Promise<string>
  upgradeAvailable(): Promise<boolean>

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

  deleteWorkspaceSpecificKeyStateFromDevice(): Promise<void>

  itemsKeyForEncryptedPayload(
    payload: EncryptedPayloadInterface,
  ): ItemsKeyInterface | KeySystemItemsKeyInterface | undefined
  defaultItemsKeyForItemVersion(version: ProtocolVersion, fromKeys?: ItemsKeyInterface[]): ItemsKeyInterface | undefined

  unwrapRootKey(wrappingKey: RootKeyInterface): Promise<void>
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

  asymmetricSignatureVerifyDetached(
    encryptedString: AsymmetricallyEncryptedString,
  ): AsymmetricSignatureVerificationDetachedResult
  getSenderPublicKeySetFromAsymmetricallyEncryptedString(string: string): PortablePublicKeySet
}
