import { removeFromArray } from '@standardnotes/utils'
import { SNRootKey } from '@standardnotes/encryption'
import { ChallengeService } from '../Challenge'
import { ActionResponse, DeprecatedHttpResponse } from '@standardnotes/responses'
import { ItemManager } from '@Lib/Services/Items/ItemManager'
import {
  SNActionsExtension,
  Action,
  ActionAccessType,
  ActionsExtensionMutator,
  MutationType,
  CreateDecryptedItemFromPayload,
  DecryptedItemInterface,
  DecryptedPayloadInterface,
  ActionExtensionContent,
  EncryptedPayload,
  isErrorDecryptingPayload,
  CreateEncryptedBackupFileContextPayload,
  EncryptedTransferPayload,
  TransferPayload,
  ItemContent,
} from '@standardnotes/models'
import { DeprecatedHttpService } from '../Api/DeprecatedHttpService'
import {
  AbstractService,
  DeviceInterface,
  InternalEventBusInterface,
  AlertService,
  ChallengeValidation,
  ChallengeReason,
  ChallengePrompt,
  EncryptionService,
  Challenge,
} from '@standardnotes/services'
import { ContentType } from '@standardnotes/domain-core'

type PayloadRequestHandler = (uuid: string) => TransferPayload | undefined

/**
 * The Actions Service allows clients to interact with action-based extensions.
 * Action-based extensions are mostly RESTful actions that can push a local value or
 * retrieve a remote value and act on it accordingly.
 * There are 4 action types:
 * `get`: performs a GET request on an endpoint to retrieve an item value, and merges the
 *      value onto the local item value. For example, you can GET an item's older revision
 *      value and replace the current value with the revision.
 * `render`: performs a GET request, and displays the result in the UI. This action does not
 *         affect data unless action is taken explicitely in the UI after the data is presented.
 * `show`: opens the action's URL in a browser.
 * `post`: sends an item's data to a remote service. This is used for example by Listed
 *       to allow publishing a note to a user's blog.
 */
export class ActionsService extends AbstractService {
  private previousPasswords: string[] = []
  private payloadRequestHandlers: PayloadRequestHandler[] = []

  constructor(
    private itemManager: ItemManager,
    private alertService: AlertService,
    private device: DeviceInterface,
    private httpService: DeprecatedHttpService,
    private encryptionService: EncryptionService,
    private challengeService: ChallengeService,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
    this.previousPasswords = []
  }

  public override deinit(): void {
    ;(this.itemManager as unknown) = undefined
    ;(this.alertService as unknown) = undefined
    ;(this.device as unknown) = undefined
    ;(this.httpService as unknown) = undefined
    ;(this.challengeService as unknown) = undefined
    ;(this.encryptionService as unknown) = undefined
    this.payloadRequestHandlers.length = 0
    this.previousPasswords.length = 0
    super.deinit()
  }

  public addPayloadRequestHandler(handler: PayloadRequestHandler) {
    this.payloadRequestHandlers.push(handler)

    return () => {
      removeFromArray(this.payloadRequestHandlers, handler)
    }
  }

  public getExtensions(): SNActionsExtension[] {
    const extensionItems = this.itemManager.getItems<SNActionsExtension>(ContentType.TYPES.ActionsExtension)
    const excludingListed = extensionItems.filter((extension) => !extension.isListedExtension)
    return excludingListed
  }

  public extensionsInContextOfItem(item: DecryptedItemInterface) {
    return this.getExtensions().filter((ext) => {
      return ext.supported_types.includes(item.content_type) || ext.actionsWithContextForItem(item).length > 0
    })
  }

  /**
   * Loads an extension in the context of a certain item.
   * The server then has the chance to respond with actions that are
   * relevant just to this item. The response extension is not saved,
   * just displayed as a one-time thing.
   */
  public async loadExtensionInContextOfItem(
    extension: SNActionsExtension,
    item: DecryptedItemInterface,
  ): Promise<SNActionsExtension | undefined> {
    const params = {
      content_type: item.content_type,
      item_uuid: item.uuid,
    }

    const response = (await this.httpService.getAbsolute(extension.url, params).catch((response) => {
      console.error('Error loading extension', response)
      return undefined
    })) as ActionResponse

    if (!response) {
      return
    }

    const description = response.description || extension.description
    const supported_types = response.supported_types || extension.supported_types
    const actions = (response.actions || []) as Action[]
    const mutator = new ActionsExtensionMutator(extension, MutationType.UpdateUserTimestamps)

    mutator.deprecation = response.deprecation
    mutator.description = description
    mutator.supported_types = supported_types
    mutator.actions = actions

    const payloadResult = mutator.getResult()

    return CreateDecryptedItemFromPayload(payloadResult) as SNActionsExtension
  }

  public async runAction(action: Action, item: DecryptedItemInterface): Promise<ActionResponse | undefined> {
    let result
    switch (action.verb) {
      case 'render':
        result = await this.handleRenderAction(action)
        break
      case 'show':
        result = this.handleShowAction(action)
        break
      case 'post':
        result = await this.handlePostAction(action, item)
        break
      default:
        break
    }
    return result
  }

  private async handleRenderAction(action: Action): Promise<ActionResponse | undefined> {
    const response = await this.httpService
      .getAbsolute(action.url)
      .then(async (response) => {
        const payload = await this.payloadByDecryptingResponse(response as ActionResponse)
        if (payload) {
          const item = CreateDecryptedItemFromPayload<ActionExtensionContent, SNActionsExtension>(payload)
          return {
            ...(response as ActionResponse),
            item,
          }
        } else {
          return undefined
        }
      })
      .catch((response) => {
        const error = (response && response.error) || {
          message: 'An issue occurred while processing this action. Please try again.',
        }
        void this.alertService.alert(error.message)
        return { error } as DeprecatedHttpResponse
      })

    return response as ActionResponse
  }

  private async payloadByDecryptingResponse(
    response: ActionResponse,
    rootKey?: SNRootKey,
    triedPasswords: string[] = [],
  ): Promise<DecryptedPayloadInterface<ActionExtensionContent> | undefined> {
    if (!response.item || response.item.deleted || response.item.content == undefined) {
      return undefined
    }

    const payload = new EncryptedPayload(response.item as EncryptedTransferPayload)

    if (!payload.enc_item_key) {
      void this.alertService.alert('This revision is missing its key and cannot be recovered.')
      return
    }

    let decryptedPayload = await this.encryptionService.decryptSplitSingle<ActionExtensionContent>({
      usesItemsKeyWithKeyLookup: {
        items: [payload],
      },
    })

    if (!isErrorDecryptingPayload(decryptedPayload)) {
      return decryptedPayload
    }

    if (rootKey) {
      decryptedPayload = await this.encryptionService.decryptSplitSingle({
        usesRootKey: {
          items: [payload],
          key: rootKey,
        },
      })
      if (!isErrorDecryptingPayload(decryptedPayload)) {
        return decryptedPayload
      }
    }

    for (const itemsKey of this.itemManager.getDisplayableItemsKeys()) {
      const decryptedPayload = await this.encryptionService.decryptSplitSingle<ActionExtensionContent>({
        usesItemsKey: {
          items: [payload],
          key: itemsKey,
        },
      })

      if (!isErrorDecryptingPayload(decryptedPayload)) {
        return decryptedPayload
      }
    }

    const keyParamsData = response.keyParams || response.auth_params
    if (!keyParamsData) {
      /**
       * In some cases revisions were missing auth params.
       * Instruct the user to email us to get this remedied.
       */
      void this.alertService.alert(
        'We were unable to decrypt this revision using your current keys, ' +
          'and this revision is missing metadata that would allow us to try different ' +
          'keys to decrypt it. This can likely be fixed with some manual intervention. ' +
          'Please email help@standardnotes.com for assistance.',
      )
      return undefined
    }
    const keyParams = this.encryptionService.createKeyParams(keyParamsData)

    /* Try previous passwords */
    for (const passwordCandidate of this.previousPasswords) {
      if (triedPasswords.includes(passwordCandidate)) {
        continue
      }

      triedPasswords.push(passwordCandidate)

      const key = await this.encryptionService.computeRootKey(passwordCandidate, keyParams)
      if (!key) {
        continue
      }

      const nestedResponse = await this.payloadByDecryptingResponse(response, key, triedPasswords)
      if (nestedResponse) {
        return nestedResponse
      }
    }

    /** Prompt for other passwords */
    const password = await this.promptForLegacyPassword()
    if (!password) {
      return undefined
    }

    if (this.previousPasswords.includes(password)) {
      return undefined
    }

    this.previousPasswords.push(password)
    return this.payloadByDecryptingResponse(response, rootKey)
  }

  private async promptForLegacyPassword(): Promise<string | undefined> {
    const challenge = new Challenge(
      [new ChallengePrompt(ChallengeValidation.None, 'Previous Password', undefined, true)],
      ChallengeReason.Custom,
      true,
      'Unable to find key for revision. Please enter the account password you may have used at the time of the revision.',
    )

    const response = await this.challengeService.promptForChallengeResponse(challenge)

    return response?.getDefaultValue().value as string
  }

  private async handlePostAction(action: Action, item: DecryptedItemInterface) {
    const decrypted = action.access_type === ActionAccessType.Decrypted
    const itemParams = await this.outgoingPayloadForItem(item, decrypted)
    const params = {
      items: [itemParams],
    }
    return this.httpService
      .postAbsolute(action.url, params)
      .then((response) => {
        return response as ActionResponse
      })
      .catch((response) => {
        console.error('Action error response:', response)
        void this.alertService.alert('An issue occurred while processing this action. Please try again.')
        return response as ActionResponse
      })
  }

  private handleShowAction(action: Action) {
    void this.device.openUrl(action.url)
    return {} as ActionResponse
  }

  private async outgoingPayloadForItem(
    item: DecryptedItemInterface,
    decrypted = false,
  ): Promise<TransferPayload<ItemContent>> {
    const payloadFromHandler = this.getPayloadFromRequestHandlers(item.uuid)

    if (payloadFromHandler) {
      return payloadFromHandler
    }

    if (decrypted) {
      return item.payload.ejected()
    }

    const encrypted = await this.encryptionService.encryptSplitSingle({
      usesItemsKeyWithKeyLookup: { items: [item.payload] },
    })

    return CreateEncryptedBackupFileContextPayload(encrypted)
  }

  private getPayloadFromRequestHandlers(uuid: string): TransferPayload | undefined {
    for (const handler of this.payloadRequestHandlers) {
      const payload = handler(uuid)
      if (payload) {
        return payload
      }
    }

    return undefined
  }
}
