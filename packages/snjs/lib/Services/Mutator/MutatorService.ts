import { SNHistoryManager } from './../History/HistoryManager'
import {
  AbstractService,
  InternalEventBusInterface,
  SyncOptions,
  ChallengeValidation,
  ChallengePrompt,
  ChallengeReason,
  MutatorClientInterface,
  Challenge,
  InfoStrings,
} from '@standardnotes/services'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError } from '@standardnotes/responses'
import { ContentType, ProtocolVersion, compareVersions } from '@standardnotes/common'
import { ItemManager } from '../Items'
import { PayloadManager } from '../Payloads/PayloadManager'
import { SNComponentManager } from '../ComponentManager/ComponentManager'
import { SNProtectionService } from '../Protection/ProtectionService'
import { SNSyncService } from '../Sync'
import { Strings } from '../../Strings'
import { TagsToFoldersMigrationApplicator } from '@Lib/Migrations/Applicators/TagsToFolders'
import { ChallengeService } from '../Challenge'
import {
  BackupFile,
  BackupFileDecryptedContextualPayload,
  ComponentContent,
  CopyPayloadWithContentOverride,
  CreateDecryptedBackupFileContextPayload,
  CreateDecryptedMutatorForItem,
  CreateEncryptedBackupFileContextPayload,
  DecryptedItemInterface,
  DecryptedItemMutator,
  DecryptedPayload,
  DecryptedPayloadInterface,
  EncryptedItemInterface,
  FileItem,
  isDecryptedPayload,
  isEncryptedTransferPayload,
  ItemContent,
  MutationType,
  PayloadEmitSource,
  SmartView,
  SNComponent,
  SNNote,
  SNTag,
  TransactionalMutation,
} from '@standardnotes/models'

export class MutatorService extends AbstractService implements MutatorClientInterface {
  constructor(
    private itemManager: ItemManager,
    private syncService: SNSyncService,
    private protectionService: SNProtectionService,
    private encryption: EncryptionProviderInterface,
    private payloadManager: PayloadManager,
    private challengeService: ChallengeService,
    private componentManager: SNComponentManager,
    private historyService: SNHistoryManager,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  override deinit() {
    super.deinit()
    ;(this.itemManager as unknown) = undefined
    ;(this.syncService as unknown) = undefined
    ;(this.protectionService as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.payloadManager as unknown) = undefined
    ;(this.challengeService as unknown) = undefined
    ;(this.componentManager as unknown) = undefined
    ;(this.historyService as unknown) = undefined
  }

  public async insertItem(item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const mutator = CreateDecryptedMutatorForItem(item, MutationType.UpdateUserTimestamps)
    const dirtiedPayload = mutator.getResult()
    const insertedItem = await this.itemManager.emitItemFromPayload(dirtiedPayload, PayloadEmitSource.LocalInserted)
    return insertedItem
  }

  public async changeAndSaveItem<M extends DecryptedItemMutator = DecryptedItemMutator>(
    itemToLookupUuidFor: DecryptedItemInterface,
    mutate: (mutator: M) => void,
    updateTimestamps = true,
    emitSource?: PayloadEmitSource,
    syncOptions?: SyncOptions,
  ): Promise<DecryptedItemInterface | undefined> {
    await this.itemManager.changeItems(
      [itemToLookupUuidFor],
      mutate,
      updateTimestamps ? MutationType.UpdateUserTimestamps : MutationType.NoUpdateUserTimestamps,
      emitSource,
    )
    await this.syncService.sync(syncOptions)
    return this.itemManager.findItem(itemToLookupUuidFor.uuid)
  }

  public async changeAndSaveItems<M extends DecryptedItemMutator = DecryptedItemMutator>(
    itemsToLookupUuidsFor: DecryptedItemInterface[],
    mutate: (mutator: M) => void,
    updateTimestamps = true,
    emitSource?: PayloadEmitSource,
    syncOptions?: SyncOptions,
  ): Promise<void> {
    await this.itemManager.changeItems(
      itemsToLookupUuidsFor,
      mutate,
      updateTimestamps ? MutationType.UpdateUserTimestamps : MutationType.NoUpdateUserTimestamps,
      emitSource,
    )
    await this.syncService.sync(syncOptions)
  }

  public async changeItem<M extends DecryptedItemMutator>(
    itemToLookupUuidFor: DecryptedItemInterface,
    mutate: (mutator: M) => void,
    updateTimestamps = true,
  ): Promise<DecryptedItemInterface | undefined> {
    await this.itemManager.changeItems(
      [itemToLookupUuidFor],
      mutate,
      updateTimestamps ? MutationType.UpdateUserTimestamps : MutationType.NoUpdateUserTimestamps,
    )
    return this.itemManager.findItem(itemToLookupUuidFor.uuid)
  }

  public async changeItems<M extends DecryptedItemMutator = DecryptedItemMutator>(
    itemsToLookupUuidsFor: DecryptedItemInterface[],
    mutate: (mutator: M) => void,
    updateTimestamps = true,
  ): Promise<(DecryptedItemInterface | undefined)[]> {
    return this.itemManager.changeItems(
      itemsToLookupUuidsFor,
      mutate,
      updateTimestamps ? MutationType.UpdateUserTimestamps : MutationType.NoUpdateUserTimestamps,
    )
  }

  public async runTransactionalMutations(
    transactions: TransactionalMutation[],
    emitSource = PayloadEmitSource.LocalChanged,
    payloadSourceKey?: string,
  ): Promise<(DecryptedItemInterface | undefined)[]> {
    return this.itemManager.runTransactionalMutations(transactions, emitSource, payloadSourceKey)
  }

  public async runTransactionalMutation(
    transaction: TransactionalMutation,
    emitSource = PayloadEmitSource.LocalChanged,
    payloadSourceKey?: string,
  ): Promise<DecryptedItemInterface | undefined> {
    return this.itemManager.runTransactionalMutation(transaction, emitSource, payloadSourceKey)
  }

  async protectItems<M extends DecryptedItemMutator, I extends DecryptedItemInterface>(items: I[]): Promise<I[]> {
    const protectedItems = await this.itemManager.changeItems<M, I>(
      items,
      (mutator) => {
        mutator.protected = true
      },
      MutationType.NoUpdateUserTimestamps,
    )

    void this.syncService.sync()
    return protectedItems
  }

  async unprotectItems<M extends DecryptedItemMutator, I extends DecryptedItemInterface>(
    items: I[],
    reason: ChallengeReason,
  ): Promise<I[] | undefined> {
    if (
      !(await this.protectionService.authorizeAction(reason, {
        fallBackToAccountPassword: true,
        requireAccountPassword: false,
        forcePrompt: false,
      }))
    ) {
      return undefined
    }

    const unprotectedItems = await this.itemManager.changeItems<M, I>(
      items,
      (mutator) => {
        mutator.protected = false
      },
      MutationType.NoUpdateUserTimestamps,
    )

    void this.syncService.sync()
    return unprotectedItems
  }

  public async protectNote(note: SNNote): Promise<SNNote> {
    const result = await this.protectItems([note])
    return result[0]
  }

  public async unprotectNote(note: SNNote): Promise<SNNote | undefined> {
    const result = await this.unprotectItems([note], ChallengeReason.UnprotectNote)
    return result ? result[0] : undefined
  }

  public async protectNotes(notes: SNNote[]): Promise<SNNote[]> {
    return this.protectItems(notes)
  }

  public async unprotectNotes(notes: SNNote[]): Promise<SNNote[]> {
    const results = await this.unprotectItems(notes, ChallengeReason.UnprotectNote)
    return results || []
  }

  async protectFile(file: FileItem): Promise<FileItem> {
    const result = await this.protectItems([file])
    return result[0]
  }

  async unprotectFile(file: FileItem): Promise<FileItem | undefined> {
    const result = await this.unprotectItems([file], ChallengeReason.UnprotectFile)
    return result ? result[0] : undefined
  }

  public async mergeItem(item: DecryptedItemInterface, source: PayloadEmitSource): Promise<DecryptedItemInterface> {
    return this.itemManager.emitItemFromPayload(item.payloadRepresentation(), source)
  }

  public createTemplateItem<
    C extends ItemContent = ItemContent,
    I extends DecryptedItemInterface<C> = DecryptedItemInterface<C>,
  >(contentType: ContentType, content?: C, override?: Partial<DecryptedPayload<C>>): I {
    return this.itemManager.createTemplateItem(contentType, content, override)
  }

  public async setItemNeedsSync(
    item: DecryptedItemInterface,
    updateTimestamps = false,
  ): Promise<DecryptedItemInterface | undefined> {
    return this.itemManager.setItemDirty(item, updateTimestamps)
  }

  public async setItemsNeedsSync(items: DecryptedItemInterface[]): Promise<(DecryptedItemInterface | undefined)[]> {
    return this.itemManager.setItemsDirty(items)
  }

  public async deleteItem(item: DecryptedItemInterface | EncryptedItemInterface): Promise<void> {
    return this.deleteItems([item])
  }

  public async deleteItems(items: (DecryptedItemInterface | EncryptedItemInterface)[]): Promise<void> {
    await this.itemManager.setItemsToBeDeleted(items)
    await this.syncService.sync()
  }

  public async emptyTrash(): Promise<void> {
    await this.itemManager.emptyTrash()
    await this.syncService.sync()
  }

  public duplicateItem<T extends DecryptedItemInterface>(
    item: T,
    additionalContent?: Partial<T['content']>,
  ): Promise<T> {
    const duplicate = this.itemManager.duplicateItem<T>(item, false, additionalContent)
    void this.syncService.sync()
    return duplicate
  }

  public async migrateTagsToFolders(): Promise<unknown> {
    await TagsToFoldersMigrationApplicator.run(this.itemManager)
    return this.syncService.sync()
  }

  public async setTagParent(parentTag: SNTag, childTag: SNTag): Promise<void> {
    await this.itemManager.setTagParent(parentTag, childTag)
  }

  public async unsetTagParent(childTag: SNTag): Promise<void> {
    await this.itemManager.unsetTagParent(childTag)
  }

  public async findOrCreateTag(title: string): Promise<SNTag> {
    return this.itemManager.findOrCreateTagByTitle(title)
  }

  /** Creates and returns the tag but does not run sync. Callers must perform sync. */
  public async createTagOrSmartView(title: string): Promise<SNTag | SmartView> {
    return this.itemManager.createTagOrSmartView(title)
  }

  public async toggleComponent(component: SNComponent): Promise<void> {
    await this.componentManager.toggleComponent(component.uuid)
    await this.syncService.sync()
  }

  public async toggleTheme(theme: SNComponent): Promise<void> {
    await this.componentManager.toggleTheme(theme.uuid)
    await this.syncService.sync()
  }

  public async importData(
    data: BackupFile,
    awaitSync = false,
  ): Promise<
    | {
        affectedItems: DecryptedItemInterface[]
        errorCount: number
      }
    | {
        error: ClientDisplayableError
      }
  > {
    if (data.version) {
      /**
       * Prior to 003 backup files did not have a version field so we cannot
       * stop importing if there is no backup file version, only if there is
       * an unsupported version.
       */
      const version = data.version as ProtocolVersion

      const supportedVersions = this.encryption.supportedVersions()
      if (!supportedVersions.includes(version)) {
        return { error: new ClientDisplayableError(InfoStrings.UnsupportedBackupFileVersion) }
      }

      const userVersion = this.encryption.getUserVersion()
      if (userVersion && compareVersions(version, userVersion) === 1) {
        /** File was made with a greater version than the user's account */
        return { error: new ClientDisplayableError(InfoStrings.BackupFileMoreRecentThanAccount) }
      }
    }

    let password: string | undefined

    if (data.auth_params || data.keyParams) {
      /** Get import file password. */
      const challenge = new Challenge(
        [new ChallengePrompt(ChallengeValidation.None, Strings.Input.FileAccountPassword, undefined, true)],
        ChallengeReason.DecryptEncryptedFile,
        true,
      )
      const passwordResponse = await this.challengeService.promptForChallengeResponse(challenge)
      if (passwordResponse == undefined) {
        /** Challenge was canceled */
        return { error: new ClientDisplayableError('Import aborted') }
      }
      this.challengeService.completeChallenge(challenge)
      password = passwordResponse?.values[0].value as string
    }

    if (!(await this.protectionService.authorizeFileImport())) {
      return { error: new ClientDisplayableError('Import aborted') }
    }

    data.items = data.items.map((item) => {
      if (isEncryptedTransferPayload(item)) {
        return CreateEncryptedBackupFileContextPayload(item)
      } else {
        return CreateDecryptedBackupFileContextPayload(item as BackupFileDecryptedContextualPayload)
      }
    })

    const decryptedPayloadsOrError = await this.encryption.decryptBackupFile(data, password)

    if (decryptedPayloadsOrError instanceof ClientDisplayableError) {
      return { error: decryptedPayloadsOrError }
    }

    const validPayloads = decryptedPayloadsOrError.filter(isDecryptedPayload).map((payload) => {
      /* Don't want to activate any components during import process in
       * case of exceptions breaking up the import proccess */
      if (payload.content_type === ContentType.Component && (payload.content as ComponentContent).active) {
        const typedContent = payload as DecryptedPayloadInterface<ComponentContent>
        return CopyPayloadWithContentOverride(typedContent, {
          active: false,
        })
      } else {
        return payload
      }
    })

    const affectedUuids = await this.payloadManager.importPayloads(
      validPayloads,
      this.historyService.getHistoryMapCopy(),
    )

    const promise = this.syncService.sync()

    if (awaitSync) {
      await promise
    }

    const affectedItems = this.itemManager.findItems(affectedUuids) as DecryptedItemInterface[]

    return {
      affectedItems: affectedItems,
      errorCount: decryptedPayloadsOrError.length - validPayloads.length,
    }
  }
}
