import { SNPreferencesService } from '../Preferences/PreferencesService'
import {
  ComponentViewerInterface,
  ComponentViewerError,
  FeatureStatus,
  FeaturesEvent,
  AlertService,
} from '@standardnotes/services'
import { SNFeaturesService } from '@Lib/Services'
import {
  ActionObserver,
  ComponentEventObserver,
  ComponentViewerEvent,
  ComponentMessage,
  SNComponent,
  PrefKey,
  NoteContent,
  MutationType,
  CreateDecryptedItemFromPayload,
  DecryptedItemInterface,
  DeletedItemInterface,
  EncryptedItemInterface,
  isDecryptedItem,
  isNotEncryptedItem,
  isNote,
  CreateComponentRetrievedContextPayload,
  createComponentCreatedContextPayload,
  DecryptedPayload,
  ItemContent,
  ComponentDataDomain,
  PayloadEmitSource,
  PayloadTimestampDefaults,
  IncomingComponentItemPayload,
  MessageData,
  Environment,
  Platform,
  OutgoingItemMessagePayload,
} from '@standardnotes/models'
import find from 'lodash/find'
import uniq from 'lodash/uniq'
import remove from 'lodash/remove'
import { SNSyncService } from '@Lib/Services/Sync/SyncService'
import { environmentToString, platformToString } from '@Lib/Application/Platforms'
import {
  MessageReply,
  StreamItemsMessageData,
  AllowedBatchContentTypes,
  DeleteItemsMessageData,
  MessageReplyData,
} from './Types'
import { ComponentAction, ComponentPermission, ComponentArea, FindNativeFeature } from '@standardnotes/features'
import { ItemManager } from '@Lib/Services/Items/ItemManager'
import { UuidString } from '@Lib/Types/UuidString'
import { ContentType } from '@standardnotes/common'
import {
  isString,
  extendArray,
  Copy,
  removeFromArray,
  log,
  nonSecureRandomIdentifier,
  UuidGenerator,
  Uuids,
  sureSearchArray,
  isNotUndefined,
} from '@standardnotes/utils'

type RunWithPermissionsCallback = (
  componentUuid: UuidString,
  requiredPermissions: ComponentPermission[],
  runFunction: () => void,
) => void

type ComponentManagerFunctions = {
  runWithPermissions: RunWithPermissionsCallback
  urlsForActiveThemes: () => string[]
}

const ReadwriteActions = [
  ComponentAction.SaveItems,
  ComponentAction.AssociateItem,
  ComponentAction.DeassociateItem,
  ComponentAction.CreateItem,
  ComponentAction.CreateItems,
  ComponentAction.DeleteItems,
  ComponentAction.SetComponentData,
]

type Writeable<T> = { -readonly [P in keyof T]: T[P] }

export class ComponentViewer implements ComponentViewerInterface {
  private streamItems?: ContentType[]
  private streamContextItemOriginalMessage?: ComponentMessage
  private streamItemsOriginalMessage?: ComponentMessage
  private removeItemObserver: () => void
  private loggingEnabled = false
  public identifier = nonSecureRandomIdentifier()
  private actionObservers: ActionObserver[] = []
  public overrideContextItem?: DecryptedItemInterface
  private featureStatus: FeatureStatus
  private removeFeaturesObserver: () => void
  private eventObservers: ComponentEventObserver[] = []
  private dealloced = false

  private window?: Window
  private hidden = false
  private readonly = false
  public lockReadonly = false
  public sessionKey?: string

  constructor(
    public readonly component: SNComponent,
    private itemManager: ItemManager,
    private syncService: SNSyncService,
    private alertService: AlertService,
    private preferencesSerivce: SNPreferencesService,
    featuresService: SNFeaturesService,
    private environment: Environment,
    private platform: Platform,
    private componentManagerFunctions: ComponentManagerFunctions,
    public readonly url?: string,
    private contextItemUuid?: UuidString,
    actionObserver?: ActionObserver,
  ) {
    this.removeItemObserver = this.itemManager.addObserver(
      ContentType.Any,
      ({ changed, inserted, removed, source, sourceKey }) => {
        if (this.dealloced) {
          return
        }
        const items = [...changed, ...inserted, ...removed]
        this.handleChangesInItems(items, source, sourceKey)
      },
    )
    if (actionObserver) {
      this.actionObservers.push(actionObserver)
    }

    this.featureStatus = featuresService.getFeatureStatus(component.identifier)

    this.removeFeaturesObserver = featuresService.addEventObserver((event) => {
      if (this.dealloced) {
        return
      }
      if (event === FeaturesEvent.FeaturesUpdated) {
        const featureStatus = featuresService.getFeatureStatus(component.identifier)

        if (featureStatus !== this.featureStatus) {
          this.featureStatus = featureStatus
          this.notifyEventObservers(ComponentViewerEvent.FeatureStatusUpdated)
        }
      }
    })

    this.log('Constructor', this)
  }

  get isDesktop(): boolean {
    return this.environment === Environment.Desktop
  }

  get isMobile(): boolean {
    return this.environment === Environment.Mobile
  }

  public destroy(): void {
    this.log('Destroying', this)
    this.deinit()
  }

  private deinit(): void {
    this.dealloced = true
    ;(this.component as unknown) = undefined
    ;(this.itemManager as unknown) = undefined
    ;(this.syncService as unknown) = undefined
    ;(this.alertService as unknown) = undefined
    ;(this.preferencesSerivce as unknown) = undefined
    ;(this.componentManagerFunctions as unknown) = undefined

    this.eventObservers.length = 0
    this.actionObservers.length = 0

    this.removeFeaturesObserver()
    ;(this.removeFeaturesObserver as unknown) = undefined

    this.removeItemObserver()
    ;(this.removeItemObserver as unknown) = undefined
  }

  public addEventObserver(observer: ComponentEventObserver): () => void {
    this.eventObservers.push(observer)

    const thislessChangeObservers = this.eventObservers
    return () => {
      removeFromArray(thislessChangeObservers, observer)
    }
  }

  private notifyEventObservers(event: ComponentViewerEvent): void {
    for (const observer of this.eventObservers) {
      observer(event)
    }
  }

  public addActionObserver(observer: ActionObserver): () => void {
    this.actionObservers.push(observer)

    const thislessChangeObservers = this.actionObservers
    return () => {
      removeFromArray(thislessChangeObservers, observer)
    }
  }

  public setReadonly(readonly: boolean): void {
    if (this.lockReadonly) {
      throw Error('Attempting to set readonly on lockedReadonly component viewer')
    }
    this.readonly = readonly
  }

  get componentUuid(): string {
    return this.component.uuid
  }

  public getFeatureStatus(): FeatureStatus {
    return this.featureStatus
  }

  private isOfflineRestricted(): boolean {
    return this.component.offlineOnly && !this.isDesktop
  }

  private isNativeFeature(): boolean {
    return !!FindNativeFeature(this.component.identifier)
  }

  private hasUrlError(): boolean {
    if (this.isNativeFeature()) {
      return false
    }
    return this.isDesktop
      ? !this.component.local_url && !this.component.hasValidHostedUrl()
      : !this.component.hasValidHostedUrl()
  }

  public shouldRender(): boolean {
    return this.getError() == undefined
  }

  public getError(): ComponentViewerError | undefined {
    if (this.isOfflineRestricted()) {
      return ComponentViewerError.OfflineRestricted
    }
    if (this.hasUrlError()) {
      return ComponentViewerError.MissingUrl
    }

    return undefined
  }

  private updateOurComponentRefFromChangedItems(items: DecryptedItemInterface[]): void {
    const updatedComponent = items.find((item) => item.uuid === this.component.uuid)
    if (updatedComponent && isDecryptedItem(updatedComponent)) {
      ;(this.component as Writeable<SNComponent>) = updatedComponent as SNComponent
    }
  }

  handleChangesInItems(
    items: (DecryptedItemInterface | DeletedItemInterface | EncryptedItemInterface)[],
    source: PayloadEmitSource,
    sourceKey?: string,
  ): void {
    const nonencryptedItems = items.filter(isNotEncryptedItem)
    const nondeletedItems = nonencryptedItems.filter(isDecryptedItem)

    this.updateOurComponentRefFromChangedItems(nondeletedItems)

    const areWeOriginator = sourceKey && sourceKey === this.component.uuid
    if (areWeOriginator) {
      return
    }

    if (this.streamItems) {
      const relevantItems = nonencryptedItems.filter((item) => {
        return this.streamItems?.includes(item.content_type)
      })

      if (relevantItems.length > 0) {
        this.sendManyItemsThroughBridge(relevantItems)
      }
    }

    if (this.streamContextItemOriginalMessage) {
      const matchingItem = find(nondeletedItems, { uuid: this.contextItemUuid })
      if (matchingItem) {
        this.sendContextItemThroughBridge(matchingItem, source)
      }
    }
  }

  sendManyItemsThroughBridge(items: (DecryptedItemInterface | DeletedItemInterface)[]): void {
    const requiredPermissions: ComponentPermission[] = [
      {
        name: ComponentAction.StreamItems,
        content_types: this.streamItems!.sort(),
      },
    ]

    this.componentManagerFunctions.runWithPermissions(this.component.uuid, requiredPermissions, () => {
      this.sendItemsInReply(items, this.streamItemsOriginalMessage!)
    })
  }

  sendContextItemThroughBridge(item: DecryptedItemInterface, source?: PayloadEmitSource): void {
    const requiredContextPermissions = [
      {
        name: ComponentAction.StreamContextItem,
      },
    ] as ComponentPermission[]
    this.componentManagerFunctions.runWithPermissions(this.component.uuid, requiredContextPermissions, () => {
      this.log(
        'Send context item in reply',
        'component:',
        this.component,
        'item: ',
        item,
        'originalMessage: ',
        this.streamContextItemOriginalMessage,
      )
      const response: MessageReplyData = {
        item: this.jsonForItem(item, source),
      }
      this.replyToMessage(this.streamContextItemOriginalMessage!, response)
    })
  }

  private log(message: string, ...args: unknown[]): void {
    if (this.loggingEnabled) {
      log('ComponentViewer', message, args)
    }
  }

  private sendItemsInReply(
    items: (DecryptedItemInterface | DeletedItemInterface)[],
    message: ComponentMessage,
    source?: PayloadEmitSource,
  ): void {
    this.log('Send items in reply', this.component, items, message)

    const responseData: MessageReplyData = {}

    const mapped = items.map((item) => {
      return this.jsonForItem(item, source)
    })

    responseData.items = mapped

    this.replyToMessage(message, responseData)
  }

  private jsonForItem(
    item: DecryptedItemInterface | DeletedItemInterface,
    source?: PayloadEmitSource,
  ): OutgoingItemMessagePayload {
    const isMetadatUpdate =
      source === PayloadEmitSource.RemoteSaved ||
      source === PayloadEmitSource.OfflineSyncSaved ||
      source === PayloadEmitSource.PreSyncSave

    const params: OutgoingItemMessagePayload = {
      uuid: item.uuid,
      content_type: item.content_type,
      created_at: item.created_at,
      updated_at: item.serverUpdatedAt,
      isMetadataUpdate: isMetadatUpdate,
    }

    if (isDecryptedItem(item)) {
      params.content = this.contentForItem(item)
      const globalComponentData = item.getDomainData(ComponentDataDomain) || {}
      const thisComponentData = globalComponentData[this.component.getClientDataKey()] || {}
      params.clientData = thisComponentData as Record<string, unknown>
    } else {
      params.deleted = true
    }

    return this.responseItemsByRemovingPrivateProperties([params])[0]
  }

  contentForItem(item: DecryptedItemInterface): ItemContent | undefined {
    if (isNote(item)) {
      const content = item.content
      const spellcheck =
        item.spellcheck != undefined
          ? item.spellcheck
          : this.preferencesSerivce.getValue(PrefKey.EditorSpellcheck, true)

      return {
        ...content,
        spellcheck,
      } as NoteContent
    }

    return item.content
  }

  private replyToMessage(originalMessage: ComponentMessage, replyData: MessageReplyData): void {
    const reply: MessageReply = {
      action: ComponentAction.Reply,
      original: originalMessage,
      data: replyData,
    }
    this.sendMessage(reply)
  }

  /**
   * @param essential If the message is non-essential, no alert will be shown
   *  if we can no longer find the window.
   */
  sendMessage(message: ComponentMessage | MessageReply, essential = true): void {
    const permissibleActionsWhileHidden = [ComponentAction.ComponentRegistered, ComponentAction.ActivateThemes]

    if (this.hidden && !permissibleActionsWhileHidden.includes(message.action)) {
      this.log('Component disabled for current item, ignoring messages.', this.component.name)
      return
    }

    if (!this.window && message.action === ComponentAction.Reply) {
      this.log('Component has been deallocated in between message send and reply', this.component, message)
      return
    }
    this.log('Send message to component', this.component, 'message: ', message)

    let origin = this.url
    if (!origin || !this.window) {
      if (essential) {
        void this.alertService.alert(
          `Standard Notes is trying to communicate with ${this.component.name}, ` +
            'but an error is occurring. Please restart this extension and try again.',
        )
      }
      return
    }

    if (!origin.startsWith('http') && !origin.startsWith('file')) {
      /* Native extension running in web, prefix current host */
      origin = window.location.href + origin
    }

    /* Mobile messaging requires json */
    this.window.postMessage(this.isMobile ? JSON.stringify(message) : message, origin)
  }

  private responseItemsByRemovingPrivateProperties<T extends OutgoingItemMessagePayload | IncomingComponentItemPayload>(
    responseItems: T[],
    removeUrls = false,
  ): T[] {
    /* Don't allow component to overwrite these properties. */
    let privateContentProperties = ['autoupdateDisabled', 'permissions', 'active']
    if (removeUrls) {
      privateContentProperties = privateContentProperties.concat(['hosted_url', 'local_url'])
    }

    return responseItems.map((responseItem) => {
      const privateProperties = privateContentProperties.slice()
      /** Server extensions are allowed to modify url property */
      if (removeUrls) {
        privateProperties.push('url')
      }
      if (!responseItem.content || isString(responseItem.content)) {
        return responseItem
      }

      let content: Partial<ItemContent> = {}
      for (const [key, value] of Object.entries(responseItem.content)) {
        if (!privateProperties.includes(key)) {
          content = {
            ...content,
            [key]: value,
          }
        }
      }

      return {
        ...responseItem,
        content: content,
      }
    })
  }

  public getWindow(): Window | undefined {
    return this.window
  }

  /** Called by client when the iframe is ready */
  public setWindow(window: Window): void {
    if (this.window) {
      throw Error('Attempting to override component viewer window. Create a new component viewer instead.')
    }

    this.log('setWindow', 'component: ', this.component, 'window: ', window)

    this.window = window
    this.sessionKey = UuidGenerator.GenerateUuid()

    this.sendMessage({
      action: ComponentAction.ComponentRegistered,
      sessionKey: this.sessionKey,
      componentData: this.component.componentData,
      data: {
        uuid: this.component.uuid,
        environment: environmentToString(this.environment),
        platform: platformToString(this.platform),
        activeThemeUrls: this.componentManagerFunctions.urlsForActiveThemes(),
      },
    })

    this.log('setWindow got new sessionKey', this.sessionKey)

    this.postActiveThemes()
  }

  postActiveThemes(): void {
    const urls = this.componentManagerFunctions.urlsForActiveThemes()
    const data: MessageData = {
      themes: urls,
    }

    const message: ComponentMessage = {
      action: ComponentAction.ActivateThemes,
      data: data,
    }

    this.sendMessage(message, false)
  }

  /* A hidden component will not receive messages. However, when a component is unhidden,
   * we need to send it any items it may have registered streaming for. */
  public setHidden(hidden: boolean): void {
    if (hidden) {
      this.hidden = true
    } else if (this.hidden) {
      this.hidden = false

      if (this.streamContextItemOriginalMessage) {
        this.handleStreamContextItemMessage(this.streamContextItemOriginalMessage)
      }

      if (this.streamItems) {
        this.handleStreamItemsMessage(this.streamItemsOriginalMessage!)
      }
    }
  }

  handleMessage(message: ComponentMessage): void {
    this.log('Handle message', message, this)
    if (!this.component) {
      this.log('Component not defined for message, returning', message)
      void this.alertService.alert(
        'A component is trying to communicate with Standard Notes, ' +
          'but there is an error establishing a bridge. Please restart the app and try again.',
      )
      return
    }
    if (this.readonly && ReadwriteActions.includes(message.action)) {
      void this.alertService.alert(
        `${this.component.name} is trying to save, but it is in a locked state and cannot accept changes.`,
      )
      return
    }

    const messageHandlers: Partial<Record<ComponentAction, (message: ComponentMessage) => void>> = {
      [ComponentAction.StreamItems]: this.handleStreamItemsMessage.bind(this),
      [ComponentAction.StreamContextItem]: this.handleStreamContextItemMessage.bind(this),
      [ComponentAction.SetComponentData]: this.handleSetComponentDataMessage.bind(this),
      [ComponentAction.DeleteItems]: this.handleDeleteItemsMessage.bind(this),
      [ComponentAction.CreateItems]: this.handleCreateItemsMessage.bind(this),
      [ComponentAction.CreateItem]: this.handleCreateItemsMessage.bind(this),
      [ComponentAction.SaveItems]: this.handleSaveItemsMessage.bind(this),
      [ComponentAction.SetSize]: this.handleSetSizeEvent.bind(this),
    }

    const handler = messageHandlers[message.action]
    handler?.(message)

    for (const observer of this.actionObservers) {
      observer(message.action, message.data)
    }
  }

  handleStreamItemsMessage(message: ComponentMessage): void {
    const data = message.data as StreamItemsMessageData
    const types = data.content_types.filter((type) => AllowedBatchContentTypes.includes(type)).sort()
    const requiredPermissions = [
      {
        name: ComponentAction.StreamItems,
        content_types: types,
      },
    ]
    this.componentManagerFunctions.runWithPermissions(this.component.uuid, requiredPermissions, () => {
      if (!this.streamItems) {
        this.streamItems = types
        this.streamItemsOriginalMessage = message
      }
      /* Push immediately now */
      const items: DecryptedItemInterface[] = []
      for (const contentType of types) {
        extendArray(items, this.itemManager.getItems(contentType))
      }
      this.sendItemsInReply(items, message)
    })
  }

  handleStreamContextItemMessage(message: ComponentMessage): void {
    const requiredPermissions: ComponentPermission[] = [
      {
        name: ComponentAction.StreamContextItem,
      },
    ]

    this.componentManagerFunctions.runWithPermissions(this.component.uuid, requiredPermissions, () => {
      if (!this.streamContextItemOriginalMessage) {
        this.streamContextItemOriginalMessage = message
      }
      const matchingItem = this.overrideContextItem || this.itemManager.findItem(this.contextItemUuid!)
      if (matchingItem) {
        this.sendContextItemThroughBridge(matchingItem)
      }
    })
  }

  /**
   * Save items is capable of saving existing items, and also creating new ones
   * if they don't exist.
   */
  handleSaveItemsMessage(message: ComponentMessage): void {
    let responsePayloads = message.data.items as IncomingComponentItemPayload[]
    const requiredPermissions = []

    /* Pending as in needed to be accounted for in permissions. */
    const pendingResponseItems = responsePayloads.slice()

    for (const responseItem of responsePayloads.slice()) {
      if (responseItem.uuid === this.contextItemUuid) {
        requiredPermissions.push({
          name: ComponentAction.StreamContextItem,
        })
        removeFromArray(pendingResponseItems, responseItem)
        /* We break because there can only be one context item */
        break
      }
    }

    /* Check to see if additional privileges are required */
    if (pendingResponseItems.length > 0) {
      const requiredContentTypes = uniq(
        pendingResponseItems.map((item) => {
          return item.content_type
        }),
      ).sort()

      requiredPermissions.push({
        name: ComponentAction.StreamItems,
        content_types: requiredContentTypes,
      } as ComponentPermission)
    }

    this.componentManagerFunctions.runWithPermissions(
      this.component.uuid,
      requiredPermissions,

      async () => {
        responsePayloads = this.responseItemsByRemovingPrivateProperties(responsePayloads, true)

        /* Filter locked items */
        const uuids = Uuids(responsePayloads)
        const items = this.itemManager.findItemsIncludingBlanks(uuids)
        let lockedCount = 0
        let lockedNoteCount = 0

        for (const item of items) {
          if (!item) {
            continue
          }

          if (item.locked) {
            remove(responsePayloads, { uuid: item.uuid })
            lockedCount++
            if (item.content_type === ContentType.Note) {
              lockedNoteCount++
            }
          }
        }

        if (lockedNoteCount === 1) {
          void this.alertService.alert(
            'The note you are attempting to save has editing disabled',
            'Note has Editing Disabled',
          )
          return
        } else if (lockedCount > 0) {
          const itemNoun = lockedCount === 1 ? 'item' : lockedNoteCount === lockedCount ? 'notes' : 'items'
          const auxVerb = lockedCount === 1 ? 'has' : 'have'
          void this.alertService.alert(
            `${lockedCount} ${itemNoun} you are attempting to save ${auxVerb} editing disabled.`,
            'Items have Editing Disabled',
          )

          return
        }

        const contextualPayloads = responsePayloads.map((responseItem) => {
          return CreateComponentRetrievedContextPayload(responseItem)
        })

        for (const contextualPayload of contextualPayloads) {
          const item = this.itemManager.findItem(contextualPayload.uuid)
          if (!item) {
            const payload = new DecryptedPayload({
              ...PayloadTimestampDefaults(),
              ...contextualPayload,
            })
            const template = CreateDecryptedItemFromPayload(payload)
            await this.itemManager.insertItem(template)
          } else {
            if (contextualPayload.content_type !== item.content_type) {
              throw Error('Extension is trying to modify content type of item.')
            }
          }
        }

        await this.itemManager.changeItems(
          items.filter(isNotUndefined),
          (mutator) => {
            const contextualPayload = sureSearchArray(contextualPayloads, {
              uuid: mutator.getUuid(),
            })

            mutator.setCustomContent(contextualPayload.content)

            const responseItem = sureSearchArray(responsePayloads, {
              uuid: mutator.getUuid(),
            })

            if (responseItem.clientData) {
              const allComponentData = Copy(mutator.getItem().getDomainData(ComponentDataDomain) || {})
              allComponentData[this.component.getClientDataKey()] = responseItem.clientData
              mutator.setDomainData(allComponentData, ComponentDataDomain)
            }
          },
          MutationType.UpdateUserTimestamps,
          PayloadEmitSource.ComponentRetrieved,
          this.component.uuid,
        )

        this.syncService
          .sync({
            onPresyncSave: () => {
              this.replyToMessage(message, {})
            },
          })
          .catch(() => {
            this.replyToMessage(message, {
              error: 'save-error',
            })
          })
      },
    )
  }

  handleCreateItemsMessage(message: ComponentMessage): void {
    let responseItems = (message.data.item ? [message.data.item] : message.data.items) as IncomingComponentItemPayload[]

    const uniqueContentTypes = uniq(
      responseItems.map((item) => {
        return item.content_type
      }),
    )

    const requiredPermissions: ComponentPermission[] = [
      {
        name: ComponentAction.StreamItems,
        content_types: uniqueContentTypes,
      },
    ]

    this.componentManagerFunctions.runWithPermissions(this.component.uuid, requiredPermissions, async () => {
      responseItems = this.responseItemsByRemovingPrivateProperties(responseItems)
      const processedItems = []

      for (const responseItem of responseItems) {
        if (!responseItem.uuid) {
          responseItem.uuid = UuidGenerator.GenerateUuid()
        }

        const contextualPayload = createComponentCreatedContextPayload(responseItem)
        const payload = new DecryptedPayload({
          ...PayloadTimestampDefaults(),
          ...contextualPayload,
        })

        const template = CreateDecryptedItemFromPayload(payload)
        const item = await this.itemManager.insertItem(template)

        await this.itemManager.changeItem(
          item,
          (mutator) => {
            if (responseItem.clientData) {
              const allComponentData = Copy(item.getDomainData(ComponentDataDomain) || {})
              allComponentData[this.component.getClientDataKey()] = responseItem.clientData
              mutator.setDomainData(allComponentData, ComponentDataDomain)
            }
          },
          MutationType.UpdateUserTimestamps,
          PayloadEmitSource.ComponentCreated,
          this.component.uuid,
        )
        processedItems.push(item)
      }

      void this.syncService.sync()

      const reply =
        message.action === ComponentAction.CreateItem
          ? { item: this.jsonForItem(processedItems[0]) }
          : {
              items: processedItems.map((item) => {
                return this.jsonForItem(item)
              }),
            }
      this.replyToMessage(message, reply)
    })
  }

  handleDeleteItemsMessage(message: ComponentMessage): void {
    const data = message.data as DeleteItemsMessageData
    const items = data.items.filter((item) => AllowedBatchContentTypes.includes(item.content_type))

    const requiredContentTypes = uniq(items.map((item) => item.content_type)).sort() as ContentType[]

    const requiredPermissions: ComponentPermission[] = [
      {
        name: ComponentAction.StreamItems,
        content_types: requiredContentTypes,
      },
    ]

    this.componentManagerFunctions.runWithPermissions(this.component.uuid, requiredPermissions, async () => {
      const itemsData = items
      const noun = itemsData.length === 1 ? 'item' : 'items'
      let reply = null
      const didConfirm = await this.alertService.confirm(`Are you sure you want to delete ${itemsData.length} ${noun}?`)

      if (didConfirm) {
        /* Filter for any components and deactivate before deleting */
        for (const itemData of itemsData) {
          const item = this.itemManager.findItem(itemData.uuid)
          if (!item) {
            void this.alertService.alert('The item you are trying to delete cannot be found.')
            continue
          }
          await this.itemManager.setItemToBeDeleted(item, PayloadEmitSource.ComponentRetrieved)
        }

        void this.syncService.sync()

        reply = { deleted: true }
      } else {
        /* Rejected by user */
        reply = { deleted: false }
      }

      this.replyToMessage(message, reply)
    })
  }

  handleSetComponentDataMessage(message: ComponentMessage): void {
    const noPermissionsRequired: ComponentPermission[] = []
    this.componentManagerFunctions.runWithPermissions(this.component.uuid, noPermissionsRequired, async () => {
      await this.itemManager.changeComponent(this.component, (mutator) => {
        mutator.componentData = message.data.componentData || {}
      })

      void this.syncService.sync()
    })
  }

  handleSetSizeEvent(message: ComponentMessage): void {
    if (this.component.area !== ComponentArea.EditorStack) {
      return
    }

    const parent = this.getIframe()?.parentElement
    if (!parent) {
      return
    }

    const data = message.data
    const widthString = isString(data.width) ? data.width : `${data.width}px`
    const heightString = isString(data.height) ? data.height : `${data.height}px`
    if (parent) {
      parent.setAttribute('style', `width:${widthString}; height:${heightString};`)
    }
  }

  getIframe(): HTMLIFrameElement | undefined {
    return Array.from(document.getElementsByTagName('iframe')).find(
      (iframe) => iframe.dataset.componentViewerId === this.identifier,
    )
  }
}
