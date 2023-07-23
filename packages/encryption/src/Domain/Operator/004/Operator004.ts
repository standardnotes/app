import {
  CreateDecryptedItemFromPayload,
  ItemContent,
  ItemsKeyInterface,
  PayloadTimestampDefaults,
  DecryptedPayload,
  DecryptedPayloadInterface,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  FillItemContentSpecialized,
  ItemsKeyContentSpecialized,
  KeySystemIdentifier,
  RootKeyInterface,
  KeySystemRootKeyParamsInterface,
  PortablePublicKeySet,
} from '@standardnotes/models'
import { KeyParamsOrigination, ProtocolVersion } from '@standardnotes/common'
import { HexString, PkcKeyPair, PureCryptoInterface, Utf8String } from '@standardnotes/sncrypto-common'
import { V004Algorithm } from '../../Algorithm'
import { SNRootKeyParams } from '../../Keys/RootKey/RootKeyParams'
import {
  EncryptedInputParameters,
  EncryptedOutputParameters,
  ErrorDecryptingParameters,
} from '../../Types/EncryptedParameters'
import { DecryptedParameters } from '../../Types/DecryptedParameters'
import { ItemAuthenticatedData } from '../../Types/ItemAuthenticatedData'
import { LegacyAttachedData } from '../../Types/LegacyAttachedData'
import { RootKeyEncryptedAuthenticatedData } from '../../Types/RootKeyEncryptedAuthenticatedData'
import { OperatorInterface } from '../OperatorInterface/OperatorInterface'
import { AsymmetricallyEncryptedString } from '../Types/Types'
import { AsymmetricItemAdditionalData } from '../../Types/EncryptionAdditionalData'
import { V004AsymmetricStringComponents } from './V004AlgorithmTypes'
import { AsymmetricEncrypt004 } from './UseCase/Asymmetric/AsymmetricEncrypt'
import { ParseConsistentBase64JsonPayloadUseCase } from './UseCase/Utils/ParseConsistentBase64JsonPayload'
import { AsymmetricDecrypt004 } from './UseCase/Asymmetric/AsymmetricDecrypt'
import { GenerateDecryptedParametersUseCase } from './UseCase/Symmetric/GenerateDecryptedParameters'
import { GenerateEncryptedParametersUseCase } from './UseCase/Symmetric/GenerateEncryptedParameters'
import { DeriveRootKeyUseCase } from './UseCase/RootKey/DeriveRootKey'
import { GetPayloadAuthenticatedDataDetachedUseCase } from './UseCase/Symmetric/GetPayloadAuthenticatedDataDetached'
import { CreateRootKeyUseCase } from './UseCase/RootKey/CreateRootKey'
import { UuidGenerator } from '@standardnotes/utils'
import { CreateKeySystemItemsKeyUseCase } from './UseCase/KeySystem/CreateKeySystemItemsKey'
import { AsymmetricDecryptResult } from '../Types/AsymmetricDecryptResult'
import { CreateRandomKeySystemRootKey } from './UseCase/KeySystem/CreateRandomKeySystemRootKey'
import { CreateUserInputKeySystemRootKey } from './UseCase/KeySystem/CreateUserInputKeySystemRootKey'
import { AsymmetricSignatureVerificationDetachedResult } from '../Types/AsymmetricSignatureVerificationDetachedResult'
import { AsymmetricSignatureVerificationDetached004 } from './UseCase/Asymmetric/AsymmetricSignatureVerificationDetached'
import { DeriveKeySystemRootKeyUseCase } from './UseCase/KeySystem/DeriveKeySystemRootKey'
import { SyncOperatorInterface } from '../OperatorInterface/SyncOperatorInterface'
import { ContentType, Result } from '@standardnotes/domain-core'
import { AsymmetricStringGetAdditionalData004 } from './UseCase/Asymmetric/AsymmetricStringGetAdditionalData'
import { AsymmetricDecryptOwnMessage004 } from './UseCase/Asymmetric/AsymmetricDecryptOwnMessage'

export class SNProtocolOperator004 implements OperatorInterface, SyncOperatorInterface {
  constructor(protected readonly crypto: PureCryptoInterface) {}

  public getEncryptionDisplayName(): string {
    return 'XChaCha20-Poly1305'
  }

  get version(): ProtocolVersion {
    return ProtocolVersion.V004
  }

  private generateNewItemsKeyContent() {
    const itemsKey = this.crypto.generateRandomKey(V004Algorithm.EncryptionKeyLength)
    const response = FillItemContentSpecialized<ItemsKeyContentSpecialized>({
      itemsKey: itemsKey,
      version: ProtocolVersion.V004,
    })
    return response
  }

  /**
   * Creates a new random items key to use for item encryption.
   * The consumer must save/sync this item.
   */
  public createItemsKey(): ItemsKeyInterface {
    const payload = new DecryptedPayload({
      uuid: UuidGenerator.GenerateUuid(),
      content_type: ContentType.TYPES.ItemsKey,
      content: this.generateNewItemsKeyContent(),
      key_system_identifier: undefined,
      shared_vault_uuid: undefined,
      ...PayloadTimestampDefaults(),
    })
    return CreateDecryptedItemFromPayload(payload)
  }

  createRandomizedKeySystemRootKey(dto: { systemIdentifier: KeySystemIdentifier }): KeySystemRootKeyInterface {
    const usecase = new CreateRandomKeySystemRootKey(this.crypto)
    return usecase.execute(dto)
  }

  createUserInputtedKeySystemRootKey(dto: {
    systemIdentifier: KeySystemIdentifier
    userInputtedPassword: string
  }): KeySystemRootKeyInterface {
    const usecase = new CreateUserInputKeySystemRootKey(this.crypto)
    return usecase.execute(dto)
  }

  deriveUserInputtedKeySystemRootKey(dto: {
    keyParams: KeySystemRootKeyParamsInterface
    userInputtedPassword: string
  }): KeySystemRootKeyInterface {
    const usecase = new DeriveKeySystemRootKeyUseCase(this.crypto)
    return usecase.execute({
      keyParams: dto.keyParams,
      password: dto.userInputtedPassword,
    })
  }

  public createKeySystemItemsKey(
    uuid: string,
    keySystemIdentifier: KeySystemIdentifier,
    sharedVaultUuid: string | undefined,
    rootKeyToken: string,
  ): KeySystemItemsKeyInterface {
    const usecase = new CreateKeySystemItemsKeyUseCase(this.crypto)
    return usecase.execute({ uuid, keySystemIdentifier, sharedVaultUuid, rootKeyToken })
  }

  public async computeRootKey<K extends RootKeyInterface>(
    password: Utf8String,
    keyParams: SNRootKeyParams,
  ): Promise<K> {
    const usecase = new DeriveRootKeyUseCase(this.crypto)
    return usecase.execute(password, keyParams)
  }

  public async createRootKey<K extends RootKeyInterface>(
    identifier: string,
    password: Utf8String,
    origination: KeyParamsOrigination,
  ): Promise<K> {
    const usecase = new CreateRootKeyUseCase(this.crypto)
    return usecase.execute(identifier, password, origination)
  }

  public getPayloadAuthenticatedDataForExternalUse(
    encrypted: EncryptedOutputParameters,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData | undefined {
    const usecase = new GetPayloadAuthenticatedDataDetachedUseCase(this.crypto)
    return usecase.execute(encrypted)
  }

  public generateEncryptedParameters(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ): EncryptedOutputParameters {
    const usecase = new GenerateEncryptedParametersUseCase(this.crypto)
    return usecase.execute(payload, key, signingKeyPair)
  }

  public generateDecryptedParameters<C extends ItemContent = ItemContent>(
    encrypted: EncryptedInputParameters,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  ): DecryptedParameters<C> | ErrorDecryptingParameters {
    const usecase = new GenerateDecryptedParametersUseCase(this.crypto)
    return usecase.execute(encrypted, key)
  }

  public asymmetricEncrypt(dto: {
    stringToEncrypt: Utf8String
    senderKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
    recipientPublicKey: HexString
  }): AsymmetricallyEncryptedString {
    const usecase = new AsymmetricEncrypt004(this.crypto)
    return usecase.execute(dto)
  }

  asymmetricDecrypt(dto: {
    stringToDecrypt: AsymmetricallyEncryptedString
    recipientSecretKey: HexString
  }): AsymmetricDecryptResult | null {
    const usecase = new AsymmetricDecrypt004(this.crypto)
    return usecase.execute(dto)
  }

  asymmetricDecryptOwnMessage(dto: {
    message: AsymmetricallyEncryptedString
    ownPrivateKey: HexString
    recipientPublicKey: HexString
  }): Result<AsymmetricDecryptResult> {
    const usecase = new AsymmetricDecryptOwnMessage004(this.crypto)
    return usecase.execute(dto)
  }

  asymmetricSignatureVerifyDetached(
    encryptedString: AsymmetricallyEncryptedString,
  ): AsymmetricSignatureVerificationDetachedResult {
    const usecase = new AsymmetricSignatureVerificationDetached004(this.crypto)
    return usecase.execute({ encryptedString })
  }

  asymmetricStringGetAdditionalData(dto: {
    encryptedString: AsymmetricallyEncryptedString
  }): Result<AsymmetricItemAdditionalData> {
    const usecase = new AsymmetricStringGetAdditionalData004(this.crypto)
    return usecase.execute(dto)
  }

  getSenderPublicKeySetFromAsymmetricallyEncryptedString(string: AsymmetricallyEncryptedString): PortablePublicKeySet {
    const [_, __, ___, additionalDataString] = <V004AsymmetricStringComponents>string.split(':')
    const parseBase64Usecase = new ParseConsistentBase64JsonPayloadUseCase(this.crypto)
    const additionalData = parseBase64Usecase.execute<AsymmetricItemAdditionalData>(additionalDataString)
    return {
      encryption: additionalData.senderPublicKey,
      signing: additionalData.signingData.publicKey,
    }
  }

  versionForAsymmetricallyEncryptedString(string: string): ProtocolVersion {
    const [versionPrefix] = <V004AsymmetricStringComponents>string.split(':')
    const version = versionPrefix.split('_')[0]
    return version as ProtocolVersion
  }
}
