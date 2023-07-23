import { ProtocolVersion } from '@standardnotes/common'
import {
  DecryptedParameters,
  ErrorDecryptingParameters,
  findDefaultItemsKey,
  isErrorDecryptingParameters,
  StandardException,
  encryptPayload,
  decryptPayload,
  EncryptedOutputParameters,
  KeySystemKeyManagerInterface,
  EncryptionOperatorsInterface,
} from '@standardnotes/encryption'
import {
  ContentTypeUsesKeySystemRootKeyEncryption,
  DecryptedPayload,
  DecryptedPayloadInterface,
  EncryptedPayload,
  EncryptedPayloadInterface,
  KeySystemRootKeyInterface,
  isEncryptedPayload,
  ItemContent,
  ItemsKeyInterface,
  PayloadEmitSource,
  KeySystemItemsKeyInterface,
  SureFindPayload,
  ContentTypeUsesRootKeyEncryption,
} from '@standardnotes/models'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { PayloadManagerInterface } from '../Payloads/PayloadManagerInterface'
import { AbstractService } from '../Service/AbstractService'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { ContentType } from '@standardnotes/domain-core'

export class ItemsEncryptionService extends AbstractService {
  private removeItemsObserver!: () => void
  public userVersion?: ProtocolVersion

  constructor(
    private itemManager: ItemManagerInterface,
    private payloadManager: PayloadManagerInterface,
    private storageService: StorageServiceInterface,
    private operatorManager: EncryptionOperatorsInterface,
    private keys: KeySystemKeyManagerInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)

    this.removeItemsObserver = this.itemManager.addObserver([ContentType.TYPES.ItemsKey], ({ changed, inserted }) => {
      if (changed.concat(inserted).length > 0) {
        void this.decryptErroredItemPayloads()
      }
    })
  }

  public override deinit(): void {
    ;(this.itemManager as unknown) = undefined
    ;(this.payloadManager as unknown) = undefined
    ;(this.storageService as unknown) = undefined
    ;(this.operatorManager as unknown) = undefined
    ;(this.keys as unknown) = undefined
    this.removeItemsObserver()
    ;(this.removeItemsObserver as unknown) = undefined
    super.deinit()
  }

  /**
   * If encryption status changes (esp. on mobile, where local storage encryption
   * can be disabled), consumers may call this function to repersist all items to
   * disk using latest encryption status.
   */
  async repersistAllItems(): Promise<void> {
    const items = this.itemManager.items
    const payloads = items.map((item) => item.payload)
    return this.storageService.savePayloads(payloads)
  }

  public getItemsKeys(): ItemsKeyInterface[] {
    return this.itemManager.getDisplayableItemsKeys()
  }

  public itemsKeyForEncryptedPayload(
    payload: EncryptedPayloadInterface,
  ): ItemsKeyInterface | KeySystemItemsKeyInterface | undefined {
    const itemsKeys = this.getItemsKeys()
    const keySystemItemsKeys = this.itemManager.getItems<KeySystemItemsKeyInterface>(
      ContentType.TYPES.KeySystemItemsKey,
    )

    return [...itemsKeys, ...keySystemItemsKeys].find(
      (key) => key.uuid === payload.items_key_id || key.duplicateOf === payload.items_key_id,
    )
  }

  public getDefaultItemsKey(): ItemsKeyInterface | undefined {
    return findDefaultItemsKey(this.getItemsKeys())
  }

  private keyToUseForItemEncryption(
    payload: DecryptedPayloadInterface,
  ): ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | StandardException {
    if (payload.key_system_identifier) {
      const keySystemItemsKey = this.keys.getPrimaryKeySystemItemsKey(payload.key_system_identifier)
      if (!keySystemItemsKey) {
        return new StandardException('Cannot find key system items key to use for encryption')
      }

      return keySystemItemsKey
    }

    const defaultKey = this.getDefaultItemsKey()

    let result: ItemsKeyInterface | undefined = undefined

    if (this.userVersion && this.userVersion !== defaultKey?.keyVersion) {
      /**
       * The default key appears to be either newer or older than the user's account version
       * We could throw an exception here, but will instead fall back to a corrective action:
       * return any items key that corresponds to the user's version
       */
      const itemsKeys = this.getItemsKeys()
      result = itemsKeys.find((key) => key.keyVersion === this.userVersion)
    } else {
      result = defaultKey
    }

    if (!result) {
      return new StandardException('Cannot find items key to use for encryption')
    }

    return result
  }

  private keyToUseForDecryptionOfPayload(
    payload: EncryptedPayloadInterface,
  ): ItemsKeyInterface | KeySystemItemsKeyInterface | undefined {
    if (payload.items_key_id) {
      const itemsKey = this.itemsKeyForEncryptedPayload(payload)
      return itemsKey
    }

    const defaultKey = this.defaultItemsKeyForItemVersion(payload.version)
    return defaultKey
  }

  public async encryptPayloadWithKeyLookup(
    payload: DecryptedPayloadInterface,
    signingKeyPair?: PkcKeyPair,
  ): Promise<EncryptedOutputParameters> {
    const key = this.keyToUseForItemEncryption(payload)

    if (key instanceof StandardException) {
      throw Error(key.message)
    }

    return this.encryptPayload(payload, key, signingKeyPair)
  }

  public async encryptPayload(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ): Promise<EncryptedOutputParameters> {
    if (isEncryptedPayload(payload)) {
      throw Error('Attempting to encrypt already encrypted payload.')
    }
    if (!payload.content) {
      throw Error('Attempting to encrypt payload with no content.')
    }
    if (!payload.uuid) {
      throw Error('Attempting to encrypt payload with no UuidGenerator.')
    }

    return encryptPayload(payload, key, this.operatorManager, signingKeyPair)
  }

  public async encryptPayloads(
    payloads: DecryptedPayloadInterface[],
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ): Promise<EncryptedOutputParameters[]> {
    return Promise.all(payloads.map((payload) => this.encryptPayload(payload, key, signingKeyPair)))
  }

  public async encryptPayloadsWithKeyLookup(
    payloads: DecryptedPayloadInterface[],
    signingKeyPair?: PkcKeyPair,
  ): Promise<EncryptedOutputParameters[]> {
    return Promise.all(payloads.map((payload) => this.encryptPayloadWithKeyLookup(payload, signingKeyPair)))
  }

  public async decryptPayloadWithKeyLookup<C extends ItemContent = ItemContent>(
    payload: EncryptedPayloadInterface,
  ): Promise<DecryptedParameters<C> | ErrorDecryptingParameters> {
    const key = this.keyToUseForDecryptionOfPayload(payload)

    if (key == undefined) {
      return {
        uuid: payload.uuid,
        errorDecrypting: true,
        waitingForKey: true,
      }
    }

    return this.decryptPayload(payload, key)
  }

  public async decryptPayload<C extends ItemContent = ItemContent>(
    payload: EncryptedPayloadInterface,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface,
  ): Promise<DecryptedParameters<C> | ErrorDecryptingParameters> {
    if (!payload.content) {
      return {
        uuid: payload.uuid,
        errorDecrypting: true,
      }
    }

    return decryptPayload(payload, key, this.operatorManager)
  }

  public async decryptPayloadsWithKeyLookup<C extends ItemContent = ItemContent>(
    payloads: EncryptedPayloadInterface[],
  ): Promise<(DecryptedParameters<C> | ErrorDecryptingParameters)[]> {
    return Promise.all(payloads.map((payload) => this.decryptPayloadWithKeyLookup<C>(payload)))
  }

  public async decryptPayloads<C extends ItemContent = ItemContent>(
    payloads: EncryptedPayloadInterface[],
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface,
  ): Promise<(DecryptedParameters<C> | ErrorDecryptingParameters)[]> {
    return Promise.all(payloads.map((payload) => this.decryptPayload<C>(payload, key)))
  }

  public async decryptErroredItemPayloads(): Promise<void> {
    const erroredItemPayloads = this.payloadManager.invalidPayloads.filter(
      (i) =>
        !ContentTypeUsesRootKeyEncryption(i.content_type) && !ContentTypeUsesKeySystemRootKeyEncryption(i.content_type),
    )
    if (erroredItemPayloads.length === 0) {
      return
    }

    const resultParams = await this.decryptPayloadsWithKeyLookup(erroredItemPayloads)

    const decryptedPayloads = resultParams.map((params) => {
      const original = SureFindPayload(erroredItemPayloads, params.uuid)
      if (isErrorDecryptingParameters(params)) {
        return new EncryptedPayload({
          ...original.ejected(),
          ...params,
        })
      } else {
        return new DecryptedPayload({
          ...original.ejected(),
          ...params,
        })
      }
    })

    await this.payloadManager.emitPayloads(decryptedPayloads, PayloadEmitSource.LocalChanged)
  }

  /**
   * When migrating from non-items key architecture, many items will not have a
   * relationship with any key object. For those items, we can be sure that only 1 key
   * object will correspond to that protocol version.
   * @returns The items key object to decrypt items encrypted
   * with previous protocol version.
   */
  public defaultItemsKeyForItemVersion(
    version: ProtocolVersion,
    fromKeys?: ItemsKeyInterface[],
  ): ItemsKeyInterface | undefined {
    /** Try to find one marked default first */
    const searchKeys = fromKeys || this.getItemsKeys()
    const priorityKey = searchKeys.find((key) => {
      return key.isDefault && key.keyVersion === version
    })
    if (priorityKey) {
      return priorityKey
    }
    return searchKeys.find((key) => {
      return key.keyVersion === version
    })
  }
}
