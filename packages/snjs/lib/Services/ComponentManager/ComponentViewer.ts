import {
  ComponentViewerInterface,
  ComponentViewerError,
  FeatureStatus,
  FeaturesEvent,
  AlertService,
  MutatorClientInterface,
  PreferenceServiceInterface,
  ComponentViewerItem,
  isComponentViewerItemReadonlyItem,
  ItemManagerInterface,
  SyncServiceInterface,
} from '@standardnotes/services'
import { FeaturesService } from '@Lib/Services'
import {
  ActionObserver,
  ComponentEventObserver,
  ComponentViewerEvent,
  ComponentMessage,
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
  ComponentPreferencesEntry,
  UIFeature,
  ComponentInterface,
} from '@standardnotes/models'
import { environmentToString, platformToString } from '@Lib/Application/Platforms'
import {
  MessageReply,
  StreamItemsMessageData,
  AllowedBatchContentTypes,
  DeleteItemsMessageData,
  MessageReplyData,
  ReadwriteActions,
} from './Types'
import { ComponentViewerRequiresComponentManagerProperties } from './ComponentViewerRequiresComponentManagerFunctions'
import {
  ComponentAction,
  ComponentPermission,
  ComponentArea,
  IframeComponentFeatureDescription,
  NativeFeatureIdentifier,
} from '@standardnotes/features'
import {
  isString,
  extendArray,
  Copy,
  removeFromArray,
  nonSecureRandomIdentifier,
  UuidGenerator,
  Uuids,
  sureSearchArray,
  isNotUndefined,
  uniqueArray,
  LoggerInterface,
} from '@standardnotes/utils'
import { ContentType, Uuid } from '@standardnotes/domain-core'

export class ComponentViewer implements ComponentViewerInterface {
  private streamItems?: string[]
  private streamContextItemOriginalMessage?: ComponentMessage
  private streamItemsOriginalMessage?: ComponentMessage
  private removeItemObserver: () => void
  public identifier = nonSecureRandomIdentifier()
  private actionObservers: ActionObserver[] = []

  private removeFeaturesObserver: () => void
  private eventObservers: ComponentEventObserver[] = []
  private dealloced = false

  private window?: Window
  private readonly = false
  public lockReadonly = false
  public sessionKey?: string

  constructor(
    private componentOrFeature: UIFeature<IframeComponentFeatureDescription>,
    private services: {
      items: ItemManagerInterface
      mutator: MutatorClientInterface
      sync: SyncServiceInterface
      alerts: AlertService
      preferences: PreferenceServiceInterface
      features: FeaturesService
      logger: LoggerInterface
    },
    private options: {
      item: ComponentViewerItem
      url: string
      actionObserver?: ActionObserver
    },
    private config: {
      environment: Environment
      platform: Platform
      componentManagerFunctions: ComponentViewerRequiresComponentManagerProperties
    },
  ) {
    if (isComponentViewerItemReadonlyItem(options.item)) {
      this.setReadonly(true)
      this.lockReadonly = true
    }
    this.removeItemObserver = this.services.items.addObserver(
      ContentType.TYPES.Any,
      ({ changed, inserted, removed, source, sourceKey }) => {
        if (this.dealloced) {
          return
        }
        const items = [...changed, ...inserted, ...removed]
        this.handleChangesInItems(items, source, sourceKey)
      },
    )
    if (options.actionObserver) {
      this.actionObservers.push(options.actionObserver)
    }

    this.removeFeaturesObserver = services.features.addEventObserver((event) => {
      if (this.dealloced) {
        return
      }

      if (event === FeaturesEvent.FeaturesAvailabilityChanged) {
        this.postActiveThemes()
        this.notifyEventObservers(ComponentViewerEvent.FeatureStatusUpdated)
      }
    })

    this.services.logger.info('Constructor', this)
  }

  public getComponentOrFeatureItem(): UIFeature<IframeComponentFeatureDescription> {
    return this.componentOrFeature
  }

  get url(): string {
    return this.options.url
  }

  get isDesktop(): boolean {
    return this.config.environment === Environment.Desktop
  }

  get isMobile(): boolean {
    return this.config.environment === Environment.Mobile
  }

  public destroy(): void {
    this.services.logger.info('Destroying', this)
    this.deinit()
  }

  private deinit(): void {
    this.dealloced = true
    ;(this.componentOrFeature as unknown) = undefined
    ;(this.services as unknown) = undefined
    ;(this.config as unknown) = undefined
    ;(this.options as unknown) = undefined

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

  get componentUniqueIdentifier(): NativeFeatureIdentifier | Uuid {
    return this.componentOrFeature.uniqueIdentifier
  }

  public getFeatureStatus(): FeatureStatus {
    return this.services.features.getFeatureStatus(this.componentUniqueIdentifier, {
      inContextOfItem: this.getContextItem(),
    })
  }

  private getContextItem(): DecryptedItemInterface | undefined {
    if (isComponentViewerItemReadonlyItem(this.options.item)) {
      return this.options.item.readonlyItem
    }

    const matchingItem = this.services.items.findItem(this.options.item.uuid)

    return matchingItem
  }

  private isOfflineRestricted(): boolean {
    return this.componentOrFeature.isComponent && this.componentOrFeature.asComponent.offlineOnly && !this.isDesktop
  }

  private hasUrlError(): boolean {
    if (!this.componentOrFeature.isComponent) {
      return false
    }

    return this.isDesktop
      ? !this.componentOrFeature.asComponent.local_url && !this.componentOrFeature.asComponent.hasValidHostedUrl
      : !this.componentOrFeature.asComponent.hasValidHostedUrl
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
    if (!this.componentOrFeature.isComponent) {
      return
    }

    const updatedComponent = items.find(
      (item) => item.uuid === this.componentUniqueIdentifier.value,
    ) as ComponentInterface
    if (!updatedComponent) {
      return
    }

    const item = new UIFeature<IframeComponentFeatureDescription>(updatedComponent)

    this.componentOrFeature = item
  }

  private handleChangesInItems(
    items: (DecryptedItemInterface | DeletedItemInterface | EncryptedItemInterface)[],
    source: PayloadEmitSource,
    sourceKey?: string,
  ): void {
    const nonencryptedItems = items.filter(isNotEncryptedItem)
    const nondeletedItems = nonencryptedItems.filter(isDecryptedItem)

    this.updateOurComponentRefFromChangedItems(nondeletedItems)

    const areWeOriginator = sourceKey && sourceKey === this.componentUniqueIdentifier.value
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
      const optionsItem = this.options.item
      if (isComponentViewerItemReadonlyItem(optionsItem)) {
        return
      }

      const matchingItem = nondeletedItems.find((item) => item.uuid === optionsItem.uuid)
      if (matchingItem) {
        this.sendContextItemThroughBridge(matchingItem, source)
      }
    }
  }

  private sendManyItemsThroughBridge(items: (DecryptedItemInterface | DeletedItemInterface)[]): void {
    const requiredPermissions: ComponentPermission[] = [
      {
        name: ComponentAction.StreamItems,
        content_types: this.streamItems?.sort(),
      },
    ]

    this.config.componentManagerFunctions.runWithPermissionsUseCase.execute(
      this.componentUniqueIdentifier.value,
      requiredPermissions,
      () => {
        this.sendItemsInReply(items, this.streamItemsOriginalMessage as ComponentMessage)
      },
    )
  }

  private sendContextItemThroughBridge(item: DecryptedItemInterface, source?: PayloadEmitSource): void {
    const requiredContextPermissions = [
      {
        name: ComponentAction.StreamContextItem,
      },
    ] as ComponentPermission[]
    this.config.componentManagerFunctions.runWithPermissionsUseCase.execute(
      this.componentUniqueIdentifier.value,
      requiredContextPermissions,
      () => {
        this.services.logger.info(
          'Send context item in reply',
          'component:',
          this.componentOrFeature,
          'item: ',
          item,
          'originalMessage: ',
          this.streamContextItemOriginalMessage,
        )
        const response: MessageReplyData = {
          item: this.jsonForItem(item, source),
        }
        this.replyToMessage(this.streamContextItemOriginalMessage as ComponentMessage, response)
      },
    )
  }

  private sendItemsInReply(
    items: (DecryptedItemInterface | DeletedItemInterface)[],
    message: ComponentMessage,
    source?: PayloadEmitSource,
  ): void {
    this.services.logger.info('Send items in reply', this.componentOrFeature, items, message)

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
      params.clientData = this.getClientData(item)
    } else {
      params.deleted = true
    }

    return this.responseItemsByRemovingPrivateProperties([params])[0]
  }

  private getClientData(item: DecryptedItemInterface): Record<string, unknown> {
    const globalComponentData = item.getDomainData(ComponentDataDomain) || {}
    const thisComponentData = globalComponentData[this.componentUniqueIdentifier.value] || {}
    return thisComponentData as Record<string, unknown>
  }

  contentForItem(item: DecryptedItemInterface): ItemContent | undefined {
    if (isNote(item)) {
      const content = item.content
      const spellcheck =
        item.spellcheck != undefined
          ? item.spellcheck
          : this.services.preferences.getValue(PrefKey.EditorSpellcheck, true)

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
  private sendMessage(message: ComponentMessage | MessageReply, essential = true): void {
    if (!this.window && message.action === ComponentAction.Reply) {
      this.services.logger.info(
        'Component has been deallocated in between message send and reply',
        this.componentOrFeature,
        message,
      )
      return
    }
    this.services.logger.info('Send message to component', this.componentOrFeature, 'message: ', message)

    if (!this.window) {
      if (essential) {
        void this.services.alerts.alert(
          `Standard Notes is trying to communicate with ${this.componentOrFeature.displayName}, ` +
            'but an error is occurring. Please restart this extension and try again.',
        )
      }
      return
    }

    /** Because iframes do not allow-same-origin, their origin is `null`, and so we can't target their explicit origin */
    const nullOrigin = '*'

    /* Mobile messaging requires json */
    this.window.postMessage(this.isMobile ? JSON.stringify(message) : message, nullOrigin)
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

  /** Called by client when the iframe is ready */
  public setWindow(window: Window): void {
    if (this.window) {
      throw Error('Attempting to override component viewer window. Create a new component viewer instead.')
    }

    this.services.logger.info('setWindow', 'component: ', this.componentOrFeature, 'window: ', window)

    this.window = window
    this.sessionKey = UuidGenerator.GenerateUuid()

    const componentData = this.config.componentManagerFunctions.getComponentPreferences(this.componentOrFeature) ?? {}

    this.sendMessage({
      action: ComponentAction.ComponentRegistered,
      sessionKey: this.sessionKey,
      componentData: componentData,
      data: {
        uuid: this.componentUniqueIdentifier.value,
        environment: environmentToString(this.config.environment),
        platform: platformToString(this.config.platform),
        activeThemeUrls: this.config.componentManagerFunctions.urlsForActiveThemes(),
      },
    })

    this.services.logger.info('setWindow got new sessionKey', this.sessionKey)

    this.postActiveThemes()
  }

  public postActiveThemes(): void {
    const urls = this.config.componentManagerFunctions.urlsForActiveThemes()
    const data: MessageData = {
      themes: urls,
    }

    const message: ComponentMessage = {
      action: ComponentAction.ActivateThemes,
      data: data,
    }

    this.sendMessage(message, false)
  }

  handleMessage(message: ComponentMessage): void {
    this.services.logger.info('Handle message', message, this)
    if (!this.componentOrFeature) {
      this.services.logger.info('Component not defined for message, returning', message)
      void this.services.alerts.alert(
        'A component is trying to communicate with Standard Notes, ' +
          'but there is an error establishing a bridge. Please restart the app and try again.',
      )
      return
    }
    if (this.readonly && ReadwriteActions.includes(message.action)) {
      void this.services.alerts.alert(
        `${this.componentOrFeature.displayName} is trying to save, but it is in a locked state and cannot accept changes.`,
      )
      return
    }

    const messageHandlers: Partial<Record<ComponentAction, (message: ComponentMessage) => void>> = {
      [ComponentAction.StreamItems]: this.handleStreamItemsMessage.bind(this),
      [ComponentAction.StreamContextItem]: this.handleStreamContextItemMessage.bind(this),
      [ComponentAction.SetComponentData]: this.handleSetComponentPreferencesMessage.bind(this),
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

  private handleStreamItemsMessage(message: ComponentMessage): void {
    const data = message.data as StreamItemsMessageData
    const types = data.content_types.filter((type) => AllowedBatchContentTypes.includes(type)).sort()
    const requiredPermissions = [
      {
        name: ComponentAction.StreamItems,
        content_types: types,
      },
    ]
    this.config.componentManagerFunctions.runWithPermissionsUseCase.execute(
      this.componentUniqueIdentifier.value,
      requiredPermissions,
      () => {
        if (!this.streamItems) {
          this.streamItems = types
          this.streamItemsOriginalMessage = message
        }
        /* Push immediately now */
        const items: DecryptedItemInterface[] = []
        for (const contentType of types) {
          extendArray(items, this.services.items.getItems(contentType))
        }
        this.sendItemsInReply(items, message)
      },
    )
  }

  private handleStreamContextItemMessage(message: ComponentMessage): void {
    const requiredPermissions: ComponentPermission[] = [
      {
        name: ComponentAction.StreamContextItem,
      },
    ]

    this.config.componentManagerFunctions.runWithPermissionsUseCase.execute(
      this.componentUniqueIdentifier.value,
      requiredPermissions,
      () => {
        if (!this.streamContextItemOriginalMessage) {
          this.streamContextItemOriginalMessage = message
        }
        const matchingItem = isComponentViewerItemReadonlyItem(this.options.item)
          ? this.options.item.readonlyItem
          : this.services.items.findItem(this.options.item.uuid)
        if (matchingItem) {
          this.sendContextItemThroughBridge(matchingItem)
        }
      },
    )
  }

  /**
   * Save items is capable of saving existing items, and also creating new ones
   * if they don't exist.
   */
  private handleSaveItemsMessage(message: ComponentMessage): void {
    let responsePayloads = message.data.items as IncomingComponentItemPayload[]
    const requiredPermissions = []

    /* Pending as in needed to be accounted for in permissions. */
    const pendingResponseItems = responsePayloads.slice()

    if (isComponentViewerItemReadonlyItem(this.options.item)) {
      return
    }

    for (const responseItem of responsePayloads.slice()) {
      if (responseItem.uuid === this.options.item.uuid) {
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
      const requiredContentTypes = uniqueArray(
        pendingResponseItems.map((item) => {
          return item.content_type
        }),
      ).sort()

      requiredPermissions.push({
        name: ComponentAction.StreamItems,
        content_types: requiredContentTypes,
      } as ComponentPermission)
    }

    this.config.componentManagerFunctions.runWithPermissionsUseCase.execute(
      this.componentUniqueIdentifier.value,
      requiredPermissions,

      async () => {
        responsePayloads = this.responseItemsByRemovingPrivateProperties(responsePayloads, true)

        /* Filter locked items */
        const uuids = Uuids(responsePayloads)
        const items = this.services.items.findItemsIncludingBlanks(uuids)
        let lockedCount = 0
        let lockedNoteCount = 0

        for (const item of items) {
          if (!item) {
            continue
          }

          if (item.locked) {
            responsePayloads = responsePayloads.filter((responseItem) => {
              return responseItem.uuid !== item.uuid
            })
            lockedCount++
            if (item.content_type === ContentType.TYPES.Note) {
              lockedNoteCount++
            }
          }
        }

        if (lockedNoteCount === 1) {
          void this.services.alerts.alert(
            'The note you are attempting to save has editing disabled',
            'Note has Editing Disabled',
          )
          return
        } else if (lockedCount > 0) {
          const itemNoun = lockedCount === 1 ? 'item' : lockedNoteCount === lockedCount ? 'notes' : 'items'
          const auxVerb = lockedCount === 1 ? 'has' : 'have'
          void this.services.alerts.alert(
            `${lockedCount} ${itemNoun} you are attempting to save ${auxVerb} editing disabled.`,
            'Items have Editing Disabled',
          )

          return
        }

        const contextualPayloads = responsePayloads.map((responseItem) => {
          return CreateComponentRetrievedContextPayload(responseItem)
        })

        for (const contextualPayload of contextualPayloads) {
          const item = this.services.items.findItem(contextualPayload.uuid)
          if (!item) {
            const payload = new DecryptedPayload({
              ...PayloadTimestampDefaults(),
              ...contextualPayload,
            })
            const template = CreateDecryptedItemFromPayload(payload)
            await this.services.mutator.insertItem(template)
          } else {
            if (contextualPayload.content_type !== item.content_type) {
              throw Error('Extension is trying to modify content type of item.')
            }
          }
        }

        await this.services.mutator.changeItems(
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
              const allComponentData = Copy<Record<string, unknown>>(
                mutator.getItem().getDomainData(ComponentDataDomain) || {},
              )
              allComponentData[this.componentUniqueIdentifier.value] = responseItem.clientData
              mutator.setDomainData(allComponentData, ComponentDataDomain)
            }
          },
          MutationType.UpdateUserTimestamps,
          PayloadEmitSource.ComponentRetrieved,
          this.componentUniqueIdentifier.value,
        )

        this.services.sync
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

  private handleCreateItemsMessage(message: ComponentMessage): void {
    let responseItems = (message.data.item ? [message.data.item] : message.data.items) as IncomingComponentItemPayload[]

    const uniqueContentTypes = uniqueArray(
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

    this.config.componentManagerFunctions.runWithPermissionsUseCase.execute(
      this.componentUniqueIdentifier.value,
      requiredPermissions,
      async () => {
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
          const item = await this.services.mutator.insertItem(template)

          await this.services.mutator.changeItem(
            item,
            (mutator) => {
              if (responseItem.clientData) {
                const allComponentClientData = Copy<Record<string, unknown>>(
                  item.getDomainData(ComponentDataDomain) || {},
                )
                allComponentClientData[this.componentUniqueIdentifier.value] = responseItem.clientData
                mutator.setDomainData(allComponentClientData, ComponentDataDomain)
              }
            },
            MutationType.UpdateUserTimestamps,
            PayloadEmitSource.ComponentCreated,
            this.componentUniqueIdentifier.value,
          )
          processedItems.push(item)
        }

        void this.services.sync.sync()

        const reply =
          message.action === ComponentAction.CreateItem
            ? { item: this.jsonForItem(processedItems[0]) }
            : {
                items: processedItems.map((item) => {
                  return this.jsonForItem(item)
                }),
              }
        this.replyToMessage(message, reply)
      },
    )
  }

  private handleDeleteItemsMessage(message: ComponentMessage): void {
    const data = message.data as DeleteItemsMessageData
    const items = data.items.filter((item) => AllowedBatchContentTypes.includes(item.content_type))

    const requiredContentTypes = uniqueArray(items.map((item) => item.content_type)).sort()

    const requiredPermissions: ComponentPermission[] = [
      {
        name: ComponentAction.StreamItems,
        content_types: requiredContentTypes,
      },
    ]

    this.config.componentManagerFunctions.runWithPermissionsUseCase.execute(
      this.componentUniqueIdentifier.value,
      requiredPermissions,
      async () => {
        const itemsData = items
        const noun = itemsData.length === 1 ? 'item' : 'items'
        let reply = null
        const didConfirm = await this.services.alerts.confirm(
          `Are you sure you want to delete ${itemsData.length} ${noun}?`,
        )

        if (didConfirm) {
          /* Filter for any components and deactivate before deleting */
          for (const itemData of itemsData) {
            const item = this.services.items.findItem(itemData.uuid)
            if (!item) {
              void this.services.alerts.alert('The item you are trying to delete cannot be found.')
              continue
            }
            await this.services.mutator.setItemToBeDeleted(item, PayloadEmitSource.ComponentRetrieved)
          }

          void this.services.sync.sync()

          reply = { deleted: true }
        } else {
          /* Rejected by user */
          reply = { deleted: false }
        }

        this.replyToMessage(message, reply)
      },
    )
  }

  private handleSetComponentPreferencesMessage(message: ComponentMessage): void {
    const noPermissionsRequired: ComponentPermission[] = []
    this.config.componentManagerFunctions.runWithPermissionsUseCase.execute(
      this.componentUniqueIdentifier.value,
      noPermissionsRequired,
      async () => {
        const newPreferences = <ComponentPreferencesEntry | undefined>message.data.componentData

        if (!newPreferences) {
          return
        }

        await this.config.componentManagerFunctions.setComponentPreferences(this.componentOrFeature, newPreferences)
      },
    )
  }

  private handleSetSizeEvent(message: ComponentMessage): void {
    if (this.componentOrFeature.area !== ComponentArea.EditorStack) {
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

  private getIframe(): HTMLIFrameElement | undefined {
    return Array.from(document.getElementsByTagName('iframe')).find(
      (iframe) => iframe.dataset.componentViewerId === this.identifier,
    )
  }
}
