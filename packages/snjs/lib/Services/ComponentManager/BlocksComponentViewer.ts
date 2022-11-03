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
  DecryptedItemInterface,
  DeletedItemInterface,
  EncryptedItemInterface,
  isDecryptedItem,
  isNotEncryptedItem,
  PayloadEmitSource,
  IncomingComponentItemPayload,
  MessageData,
  Environment,
  Platform,
  NoteBlock,
  SNNote,
  ComponentDataDomain,
  MutationType,
} from '@standardnotes/models'
import find from 'lodash/find'

import { SNSyncService } from '@Lib/Services/Sync/SyncService'
import { environmentToString, platformToString } from '@Lib/Application/Platforms'
import { OutgoingItemMessagePayload, MessageReply, MessageReplyData } from './Types'
import { ComponentAction, ComponentPermission, FindNativeFeature } from '@standardnotes/features'
import { ItemManager } from '@Lib/Services/Items/ItemManager'
import { UuidString } from '@Lib/Types/UuidString'
import { ContentType } from '@standardnotes/common'
import { removeFromArray, log, nonSecureRandomIdentifier, UuidGenerator } from '@standardnotes/utils'

type RunWithPermissionsCallback = (
  componentUuid: UuidString,
  requiredPermissions: ComponentPermission[],
  runFunction: () => void,
) => void

type ComponentManagerFunctions = {
  runWithPermissions: RunWithPermissionsCallback
  urlsForActiveThemes: () => string[]
}

const ReadwriteActions = [ComponentAction.SaveItems, ComponentAction.SetComponentData]

type Writeable<T> = { -readonly [P in keyof T]: T[P] }

export class BlocksComponentViewer implements ComponentViewerInterface {
  private streamContextItemOriginalMessage?: ComponentMessage
  private removeItemObserver: () => void
  private loggingEnabled = false
  public identifier = nonSecureRandomIdentifier()
  private actionObservers: ActionObserver[] = []
  private featureStatus: FeatureStatus
  private removeFeaturesObserver: () => void
  private eventObservers: ComponentEventObserver[] = []
  private dealloced = false

  private window?: Window
  private readonly = false
  public lockReadonly = false
  public sessionKey?: string

  private note: SNNote
  private lastBlockSent?: NoteBlock

  constructor(
    public readonly component: SNComponent,
    private noteUuid: UuidString,
    private blockId: NoteBlock['id'],
    private itemManager: ItemManager,
    private syncService: SNSyncService,
    private alertService: AlertService,
    private preferencesSerivce: SNPreferencesService,
    featuresService: SNFeaturesService,
    private environment: Environment,
    private platform: Platform,
    private componentManagerFunctions: ComponentManagerFunctions,
    public readonly url?: string,
    actionObserver?: ActionObserver,
  ) {
    this.removeItemObserver = this.itemManager.addObserver(
      ContentType.Any,
      ({ changed, inserted, removed, source, sourceKey }) => {
        if (this.dealloced) {
          return
        }
        const items = [...changed, ...inserted, ...removed]
        this.handleChangesInGlobalItems(items, source, sourceKey)
      },
    )
    if (actionObserver) {
      this.actionObservers.push(actionObserver)
    }

    this.note = this.itemManager.findSureItem(this.noteUuid)

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

  handleChangesInGlobalItems(
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

    const matchingNote = find(nondeletedItems, { uuid: this.noteUuid })
    if (matchingNote) {
      this.note = matchingNote as SNNote

      this.sendNoteToEditor(source)
    }
  }

  sendNoteToEditor(source?: PayloadEmitSource): void {
    const block = this.note.getBlock(this.blockId)

    if (this.lastBlockSent && this.lastBlockSent.content === block?.content) {
      return
    }

    this.log(
      'Sending note in reply',
      'component:',
      this.component,
      'note: ',
      this.note,
      'originalMessage: ',
      this.streamContextItemOriginalMessage,
    )

    const isMetadatUpdate =
      source === PayloadEmitSource.RemoteSaved ||
      source === PayloadEmitSource.OfflineSyncSaved ||
      source === PayloadEmitSource.PreSyncSave

    const params: OutgoingItemMessagePayload = {
      uuid: this.note.uuid,
      content_type: this.note.content_type,
      created_at: this.note.created_at,
      updated_at: this.note.serverUpdatedAt,
      isMetadataUpdate: isMetadatUpdate,
    }

    const spellcheck =
      this.note.spellcheck != undefined
        ? this.note.spellcheck
        : this.preferencesSerivce.getValue(PrefKey.EditorSpellcheck, true)

    params.content = {
      text: block?.content || '',
      spellcheck,
    } as NoteContent

    const globalComponentData = this.note.getDomainData(ComponentDataDomain) || {}
    const thisComponentData = globalComponentData[this.component.getClientDataKey()] || {}
    params.clientData = thisComponentData as Record<string, unknown>

    const response: MessageReplyData = {
      item: params,
    }

    this.replyToMessage(this.streamContextItemOriginalMessage as ComponentMessage, response)

    this.lastBlockSent = block
  }

  private log(message: string, ...args: unknown[]): void {
    if (this.loggingEnabled) {
      log('ComponentViewer', message, args)
    }
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
      [ComponentAction.StreamContextItem]: this.handleStreamContextItemMessage.bind(this),
      [ComponentAction.SetComponentData]: this.handleSetComponentDataMessage.bind(this),
      [ComponentAction.SaveItems]: this.handleSaveItemsMessage.bind(this),
    }

    const handler = messageHandlers[message.action]
    handler?.(message)

    for (const observer of this.actionObservers) {
      observer(message.action, message.data)

      if (message.data.height) {
        observer(ComponentAction.SetSize, { width: message.data.width, height: message.data.height })
      }
    }
  }

  handleStreamContextItemMessage(message: ComponentMessage): void {
    if (!this.streamContextItemOriginalMessage) {
      this.streamContextItemOriginalMessage = message
    }

    this.sendNoteToEditor()
  }

  async handleSaveItemsMessage(message: ComponentMessage): Promise<void> {
    const itemPayloads = message.data.items as IncomingComponentItemPayload[]
    const content = itemPayloads[0].content as NoteContent

    const text = content.text
    await this.itemManager.changeNote(
      this.note,
      (mutator) => {
        mutator.changeBlockContent(this.blockId, text)
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

  getIframe(): HTMLIFrameElement | undefined {
    return Array.from(document.getElementsByTagName('iframe')).find(
      (iframe) => iframe.dataset.componentViewerId === this.identifier,
    )
  }
}
