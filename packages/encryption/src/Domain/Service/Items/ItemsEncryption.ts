import { ContentType, ProtocolVersion } from '@standardnotes/common'
import { findDefaultItemsKey } from '../Functions'
import { OperatorManager } from '../../Operator/OperatorManager'
import { StandardException } from '../../StandardException'
import * as OperatorWrapper from '../../Operator/OperatorWrapper'
import * as Models from '@standardnotes/models'
import * as Services from '@standardnotes/services'
import {
  DecryptedParameters,
  EncryptedParameters,
  ErrorDecryptingParameters,
  isErrorDecryptingParameters,
} from '../../Types/EncryptedParameters'
import { isEncryptedPayload } from '@standardnotes/models'
import { DiagnosticInfo } from '@standardnotes/services'
import { Uuids } from '@standardnotes/utils'

export class ItemsEncryptionService extends Services.AbstractService {
  private removeItemsObserver!: () => void
  public userVersion?: ProtocolVersion

  constructor(
    private itemManager: Services.ItemManagerInterface,
    private payloadManager: Services.PayloadManagerInterface,
    private storageService: Services.StorageServiceInterface,
    private operatorManager: OperatorManager,
    protected override internalEventBus: Services.InternalEventBusInterface,
  ) {
    super(internalEventBus)

    this.removeItemsObserver = this.itemManager.addObserver([ContentType.ItemsKey], ({ changed, inserted }) => {
      if (changed.concat(inserted).length > 0) {
        void this.decryptErroredPayloads()
      }
    })
  }

  public override deinit(): void {
    ;(this.itemManager as unknown) = undefined
    ;(this.payloadManager as unknown) = undefined
    ;(this.storageService as unknown) = undefined
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

  public getItemsKeys() {
    return this.itemManager.getDisplayableItemsKeys()
  }

  public itemsKeyForPayload(payload: Models.EncryptedPayloadInterface): Models.ItemsKeyInterface | undefined {
    return this.getItemsKeys().find(
      (key) => key.uuid === payload.items_key_id || key.duplicateOf === payload.items_key_id,
    )
  }

  public getDefaultItemsKey(): Models.ItemsKeyInterface | undefined {
    return findDefaultItemsKey(this.getItemsKeys())
  }

  private keyToUseForItemEncryption(): Models.ItemsKeyInterface | StandardException {
    const defaultKey = this.getDefaultItemsKey()
    let result: Models.ItemsKeyInterface | undefined = undefined

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
    payload: Models.EncryptedPayloadInterface,
  ): Models.ItemsKeyInterface | undefined {
    if (payload.items_key_id) {
      const itemsKey = this.itemsKeyForPayload(payload)
      return itemsKey
    }

    const defaultKey = this.defaultItemsKeyForItemVersion(payload.version)
    return defaultKey
  }

  public async encryptPayloadWithKeyLookup(payload: Models.DecryptedPayloadInterface): Promise<EncryptedParameters> {
    const key = this.keyToUseForItemEncryption()

    if (key instanceof StandardException) {
      throw Error(key.message)
    }

    return this.encryptPayload(payload, key)
  }

  public async encryptPayload(
    payload: Models.DecryptedPayloadInterface,
    key: Models.ItemsKeyInterface,
  ): Promise<EncryptedParameters> {
    if (isEncryptedPayload(payload)) {
      throw Error('Attempting to encrypt already encrypted payload.')
    }
    if (!payload.content) {
      throw Error('Attempting to encrypt payload with no content.')
    }
    if (!payload.uuid) {
      throw Error('Attempting to encrypt payload with no UuidGenerator.')
    }

    return OperatorWrapper.encryptPayload(payload, key, this.operatorManager)
  }

  public async encryptPayloads(
    payloads: Models.DecryptedPayloadInterface[],
    key: Models.ItemsKeyInterface,
  ): Promise<EncryptedParameters[]> {
    return Promise.all(payloads.map((payload) => this.encryptPayload(payload, key)))
  }

  public async encryptPayloadsWithKeyLookup(
    payloads: Models.DecryptedPayloadInterface[],
  ): Promise<EncryptedParameters[]> {
    return Promise.all(payloads.map((payload) => this.encryptPayloadWithKeyLookup(payload)))
  }

  public async decryptPayloadWithKeyLookup<C extends Models.ItemContent = Models.ItemContent>(
    payload: Models.EncryptedPayloadInterface,
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

  public async decryptPayload<C extends Models.ItemContent = Models.ItemContent>(
    payload: Models.EncryptedPayloadInterface,
    key: Models.ItemsKeyInterface,
  ): Promise<DecryptedParameters<C> | ErrorDecryptingParameters> {
    if (!payload.content) {
      return {
        uuid: payload.uuid,
        errorDecrypting: true,
      }
    }

    return OperatorWrapper.decryptPayload(payload, key, this.operatorManager)
  }

  public async decryptPayloadsWithKeyLookup<C extends Models.ItemContent = Models.ItemContent>(
    payloads: Models.EncryptedPayloadInterface[],
  ): Promise<(DecryptedParameters<C> | ErrorDecryptingParameters)[]> {
    return Promise.all(payloads.map((payload) => this.decryptPayloadWithKeyLookup<C>(payload)))
  }

  public async decryptPayloads<C extends Models.ItemContent = Models.ItemContent>(
    payloads: Models.EncryptedPayloadInterface[],
    key: Models.ItemsKeyInterface,
  ): Promise<(DecryptedParameters<C> | ErrorDecryptingParameters)[]> {
    return Promise.all(payloads.map((payload) => this.decryptPayload<C>(payload, key)))
  }

  public async decryptErroredPayloads(): Promise<void> {
    const payloads = this.payloadManager.invalidPayloads.filter((i) => i.content_type !== ContentType.ItemsKey)
    if (payloads.length === 0) {
      return
    }

    const resultParams = await this.decryptPayloadsWithKeyLookup(payloads)

    const decryptedPayloads = resultParams.map((params) => {
      const original = Models.SureFindPayload(payloads, params.uuid)
      if (isErrorDecryptingParameters(params)) {
        return new Models.EncryptedPayload({
          ...original.ejected(),
          ...params,
        })
      } else {
        return new Models.DecryptedPayload({
          ...original.ejected(),
          ...params,
        })
      }
    })

    await this.payloadManager.emitPayloads(decryptedPayloads, Models.PayloadEmitSource.LocalChanged)
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
    fromKeys?: Models.ItemsKeyInterface[],
  ): Models.ItemsKeyInterface | undefined {
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

  override async getDiagnostics(): Promise<DiagnosticInfo | undefined> {
    const keyForItems = this.keyToUseForItemEncryption()
    return {
      itemsEncryption: {
        itemsKeysIds: Uuids(this.getItemsKeys()),
        defaultItemsKeyId: this.getDefaultItemsKey()?.uuid,
        keyToUseForItemEncryptionId: keyForItems instanceof StandardException ? undefined : keyForItems.uuid,
      },
    }
  }
}
