import { WebApplication } from '@/Application/Application'
import { RevisionType } from '@/Components/RevisionHistoryModal/RevisionType'
import {
  LegacyHistoryEntry,
  ListGroup,
  RemoteRevisionListGroup,
  sortRevisionListIntoGroups,
} from '@/Components/RevisionHistoryModal/utils'
import { STRING_RESTORE_LOCKED_ATTEMPT } from '@/Constants/Strings'
import { confirmDialog } from '@/Services/AlertService'
import {
  Action,
  ActionVerb,
  ButtonType,
  HistoryEntry,
  InternalEventBus,
  NoteHistoryEntry,
  PayloadEmitSource,
  RevisionListEntry,
  SNNote,
} from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { SelectedItemsController } from './SelectedItemsController'

type RemoteHistory = RemoteRevisionListGroup[]

type SessionHistory = ListGroup<NoteHistoryEntry>[]

type LegacyHistory = Action[]

type SelectedRevision = HistoryEntry | LegacyHistoryEntry | undefined

type SelectedEntry = RevisionListEntry | NoteHistoryEntry | Action | undefined

export enum RevisionContentState {
  Idle,
  Loading,
  Loaded,
  NotEntitled,
}

export class HistoryModalController extends AbstractViewController {
  showRevisionHistoryModal = false

  note?: SNNote = undefined

  remoteHistory: RemoteHistory = []
  isFetchingRemoteHistory = false
  sessionHistory: SessionHistory = []
  legacyHistory: LegacyHistory = []

  selectedRevision: SelectedRevision = undefined
  selectedEntry: SelectedEntry = undefined

  contentState = RevisionContentState.Idle

  currentTab = RevisionType.Remote

  isDeletingRevision = false

  override deinit(): void {
    super.deinit()
    this.clearSelection()
    this.resetHistoryState()
    this.note = undefined
    ;(this.selectionController as unknown) = undefined
  }

  constructor(
    application: WebApplication,
    eventBus: InternalEventBus,
    private selectionController: SelectedItemsController,
  ) {
    super(application, eventBus)

    makeObservable(this, {
      showRevisionHistoryModal: observable,
      setShowRevisionHistoryModal: action,

      selectedRevision: observable,
      setSelectedRevision: action,

      selectedEntry: observable,
      setSelectedEntry: action,

      remoteHistory: observable,
      setRemoteHistory: action,
      isFetchingRemoteHistory: observable,
      setIsFetchingRemoteHistory: action,

      sessionHistory: observable,
      setSessionHistory: action,

      legacyHistory: observable,
      setLegacyHistory: action,

      resetHistoryState: action,

      currentTab: observable,
      selectTab: action,

      isDeletingRevision: observable,
      setIsDeletingRevision: action,

      contentState: observable,
      setContentState: action,
    })
  }

  setSelectedRevision = (revision: SelectedRevision) => {
    this.selectedRevision = revision
  }

  setSelectedEntry = (entry: SelectedEntry) => {
    this.selectedEntry = entry
  }

  clearSelection = () => {
    this.setSelectedEntry(undefined)
    this.setSelectedRevision(undefined)
  }

  selectTab = (tab: RevisionType) => {
    this.currentTab = tab
    this.clearSelection()
    this.setContentState(RevisionContentState.Idle)
    this.selectFirstRevision()
  }

  setShowRevisionHistoryModal = (showRevisionHistoryModal: boolean) => {
    this.showRevisionHistoryModal = showRevisionHistoryModal
    if (showRevisionHistoryModal) {
      void this.fetchAllHistory()
    }
  }

  setIsFetchingRemoteHistory = (value: boolean) => {
    this.isFetchingRemoteHistory = value
  }

  setIsDeletingRevision = (value: boolean) => {
    this.isDeletingRevision = value
  }

  setContentState = (contentState: RevisionContentState) => {
    this.contentState = contentState
  }

  openModal = (note: SNNote | undefined) => {
    this.note = note
    this.setShowRevisionHistoryModal(true)
  }

  dismissModal = () => {
    this.setShowRevisionHistoryModal(false)
    this.clearSelection()
    this.resetHistoryState()
    this.selectTab(RevisionType.Remote)
  }

  selectRemoteRevision = async (entry: RevisionListEntry) => {
    if (!this.note) {
      return
    }

    if (!this.application.features.hasMinimumRole(entry.required_role)) {
      this.setContentState(RevisionContentState.NotEntitled)
      this.setSelectedRevision(undefined)
      return
    }

    this.setContentState(RevisionContentState.Loading)
    this.clearSelection()

    try {
      this.setSelectedEntry(entry)
      const remoteRevision = await this.application.historyManager.fetchRemoteRevision(this.note, entry)
      this.setSelectedRevision(remoteRevision)
    } catch (err) {
      this.clearSelection()
      console.error(err)
    } finally {
      this.setContentState(RevisionContentState.Loaded)
    }
  }

  selectLegacyRevision = async (entry: Action) => {
    this.clearSelection()
    this.setContentState(RevisionContentState.Loading)

    if (!this.note) {
      return
    }

    try {
      if (!entry.subactions?.[0]) {
        throw new Error('Could not find revision action url')
      }

      this.setSelectedEntry(entry)

      const response = await this.application.actionsManager.runAction(entry.subactions[0], this.note)

      if (!response) {
        throw new Error('Could not fetch revision')
      }

      this.setSelectedRevision(response.item as unknown as HistoryEntry)
    } catch (error) {
      console.error(error)
      this.setSelectedRevision(undefined)
    } finally {
      this.setContentState(RevisionContentState.Loaded)
    }
  }

  selectSessionRevision = (entry: NoteHistoryEntry) => {
    this.clearSelection()
    this.setSelectedEntry(entry)
    this.setSelectedRevision(entry)
  }

  private get flattenedRemoteHistory() {
    return this.remoteHistory.map((group) => group.entries).flat()
  }

  private get flattenedSessionHistory() {
    return this.sessionHistory.map((group) => group.entries).flat()
  }

  selectFirstRevision = () => {
    switch (this.currentTab) {
      case RevisionType.Remote: {
        const firstEntry = this.flattenedRemoteHistory[0]
        if (firstEntry) {
          void this.selectRemoteRevision(firstEntry)
        }
        break
      }
      case RevisionType.Session: {
        const firstEntry = this.flattenedSessionHistory[0]
        if (firstEntry) {
          void this.selectSessionRevision(firstEntry)
        }
        break
      }
      case RevisionType.Legacy: {
        const firstEntry = this.legacyHistory[0]
        if (firstEntry) {
          void this.selectLegacyRevision(firstEntry)
        }
        break
      }
    }
  }

  selectPrevOrNextRemoteRevision = (revisionEntry: RevisionListEntry) => {
    const currentIndex = this.flattenedRemoteHistory.findIndex((entry) => entry?.uuid === revisionEntry.uuid)

    const previousEntry = this.flattenedRemoteHistory[currentIndex - 1]
    const nextEntry = this.flattenedRemoteHistory[currentIndex + 1]

    if (previousEntry) {
      void this.selectRemoteRevision(previousEntry)
    }

    if (nextEntry) {
      void this.selectRemoteRevision(nextEntry)
    }
  }

  setRemoteHistory = (remoteHistory: RemoteHistory) => {
    this.remoteHistory = remoteHistory
  }

  fetchRemoteHistory = async () => {
    this.setRemoteHistory([])

    if (this.note) {
      this.setIsFetchingRemoteHistory(true)
      try {
        const initialRemoteHistory = await this.application.historyManager.remoteHistoryForItem(this.note)

        this.setRemoteHistory(sortRevisionListIntoGroups<RevisionListEntry>(initialRemoteHistory))
      } catch (err) {
        console.error(err)
      } finally {
        this.setIsFetchingRemoteHistory(false)
      }
    }
  }

  setLegacyHistory = (legacyHistory: LegacyHistory) => {
    this.legacyHistory = legacyHistory
  }

  fetchLegacyHistory = async () => {
    const actionExtensions = this.application.actionsManager.getExtensions()

    actionExtensions.forEach(async (ext) => {
      if (!this.note) {
        return
      }

      const actionExtension = await this.application.actionsManager.loadExtensionInContextOfItem(ext, this.note)

      if (!actionExtension) {
        return
      }

      const isLegacyNoteHistoryExt = actionExtension?.actions.some((action) => action.verb === ActionVerb.Nested)

      if (!isLegacyNoteHistoryExt) {
        return
      }

      this.setLegacyHistory(actionExtension.actions.filter((action) => action.subactions?.[0]))
    })
  }

  setSessionHistory = (sessionHistory: SessionHistory) => {
    this.sessionHistory = sessionHistory
  }

  fetchAllHistory = async () => {
    this.resetHistoryState()

    if (!this.note) {
      return
    }

    this.setSessionHistory(
      sortRevisionListIntoGroups<NoteHistoryEntry>(
        this.application.historyManager.sessionHistoryForItem(this.note) as NoteHistoryEntry[],
      ),
    )
    await this.fetchRemoteHistory()
    await this.fetchLegacyHistory()

    this.selectFirstRevision()
  }

  resetHistoryState = () => {
    this.remoteHistory = []
    this.sessionHistory = []
    this.legacyHistory = []
  }

  restoreRevision = async (revision: NonNullable<SelectedRevision>) => {
    const originalNote = this.application.items.findItem<SNNote>(revision.payload.uuid)

    if (originalNote?.locked) {
      this.application.alertService.alert(STRING_RESTORE_LOCKED_ATTEMPT).catch(console.error)
      return
    }

    const didConfirm = await confirmDialog({
      text: "Are you sure you want to replace the current note's contents with what you see in this preview?",
      confirmButtonStyle: 'danger',
    })

    if (!originalNote) {
      throw new Error('Original note not found.')
    }

    if (didConfirm) {
      void this.application.mutator.changeAndSaveItem(
        originalNote,
        (mutator) => {
          mutator.setCustomContent(revision.payload.content)
        },
        true,
        PayloadEmitSource.RemoteRetrieved,
      )
      this.dismissModal()
    }
  }

  restoreRevisionAsCopy = async (revision: NonNullable<SelectedRevision>) => {
    const originalNote = this.application.items.findSureItem<SNNote>(revision.payload.uuid)

    const duplicatedItem = await this.application.mutator.duplicateItem(originalNote, {
      ...revision.payload.content,
      title: revision.payload.content.title ? revision.payload.content.title + ' (copy)' : undefined,
    })

    this.selectionController.selectItem(duplicatedItem.uuid).catch(console.error)

    this.dismissModal()
  }

  deleteRemoteRevision = async (revisionEntry: RevisionListEntry) => {
    const shouldDelete = await this.application.alertService.confirm(
      'Are you sure you want to delete this revision?',
      'Delete revision?',
      'Delete revision',
      ButtonType.Danger,
      'Cancel',
    )

    if (!shouldDelete || !this.note) {
      return
    }

    this.setIsDeletingRevision(true)

    const response = await this.application.historyManager.deleteRemoteRevision(this.note, revisionEntry)

    if (response.error?.message) {
      throw new Error(response.error.message)
    }

    this.clearSelection()

    this.selectPrevOrNextRemoteRevision(revisionEntry)

    await this.fetchRemoteHistory()

    this.setIsDeletingRevision(false)
  }
}
