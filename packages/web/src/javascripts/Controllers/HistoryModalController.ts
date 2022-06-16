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
import { NotesController } from './NotesController'
import { SelectedItemsController } from './SelectedItemsController'

type RemoteHistory = RemoteRevisionListGroup[]

type SessionHistory = ListGroup<NoteHistoryEntry>[]

type LegacyHistory = Action[]

type SelectedRevision = HistoryEntry | LegacyHistoryEntry | undefined

type SelectedEntry = RevisionListEntry | NoteHistoryEntry | Action | undefined

export class HistoryModalController extends AbstractViewController {
  showRevisionHistoryModal = false

  remoteHistory: RemoteHistory = []
  isFetchingRemoteHistory = false
  sessionHistory: SessionHistory = []
  legacyHistory: LegacyHistory = []

  selectedRevision: SelectedRevision = undefined
  isFetchingSelectedRevision = false
  selectedEntry: SelectedEntry = undefined

  showContentLockedScreen = false

  currentTab = RevisionType.Remote

  isDeletingRevision = false

  override deinit(): void {
    super.deinit()
    this.clearSelection()
    this.clearAllHistory()
    ;(this.notesController as unknown) = undefined
    ;(this.selectionController as unknown) = undefined
  }

  constructor(
    application: WebApplication,
    eventBus: InternalEventBus,
    private notesController: NotesController,
    private selectionController: SelectedItemsController,
  ) {
    super(application, eventBus)

    makeObservable(this, {
      showRevisionHistoryModal: observable,
      setShowRevisionHistoryModal: action,

      selectedRevision: observable,
      setSelectedRevision: action,
      isFetchingSelectedRevision: observable,
      setIsFetchingSelectedRevision: observable,

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

      clearAllHistory: action,

      currentTab: observable,
      selectTab: action,

      showContentLockedScreen: observable,
      setShowContentLockedScreen: action,

      isDeletingRevision: observable,
      setIsDeletingRevision: action,
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
    this.selectFirstRevision()
  }

  setShowRevisionHistoryModal = (showRevisionHistoryModal: boolean) => {
    this.showRevisionHistoryModal = showRevisionHistoryModal
    void this.fetchAllHistory()
  }

  setShowContentLockedScreen = (value: boolean) => {
    this.showContentLockedScreen = value
  }

  setIsFetchingRemoteHistory = (value: boolean) => {
    this.isFetchingRemoteHistory = value
  }

  setIsFetchingSelectedRevision = (value: boolean) => {
    this.isFetchingSelectedRevision = value
  }

  setIsDeletingRevision = (value: boolean) => {
    this.isDeletingRevision = value
  }

  dismissModal = () => {
    this.setShowRevisionHistoryModal(false)
    this.clearAllHistory()
    this.selectTab(RevisionType.Remote)
  }

  selectRemoteRevision = async (entry: RevisionListEntry) => {
    this.setShowContentLockedScreen(false)

    const note = this.notesController.firstSelectedNote

    if (this.application.features.hasMinimumRole(entry.required_role) && note) {
      this.setIsFetchingSelectedRevision(true)
      this.clearSelection()

      try {
        this.setSelectedEntry(entry)
        const remoteRevision = await this.application.historyManager.fetchRemoteRevision(note, entry)
        this.setSelectedRevision(remoteRevision)
      } catch (err) {
        this.clearSelection()
        console.error(err)
      } finally {
        this.setIsFetchingSelectedRevision(false)
      }
    } else {
      this.setShowContentLockedScreen(true)
      this.setSelectedRevision(undefined)
    }
  }

  selectLegacyRevision = async (entry: Action) => {
    this.clearSelection()
    this.setIsFetchingSelectedRevision(true)

    const note = this.notesController.firstSelectedNote

    if (!note) {
      return
    }

    try {
      if (!entry.subactions?.[0]) {
        throw new Error('Could not find revision action url')
      }

      this.setSelectedEntry(entry)

      const response = await this.application.actionsManager.runAction(entry.subactions[0], note)

      if (!response) {
        throw new Error('Could not fetch revision')
      }

      this.setSelectedRevision(response.item as unknown as HistoryEntry)
    } catch (error) {
      console.error(error)
      this.setSelectedRevision(undefined)
    } finally {
      this.setIsFetchingSelectedRevision(false)
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

  setRemoteHistory = (remoteHistory: RemoteHistory) => {
    this.remoteHistory = remoteHistory
  }

  fetchRemoteHistory = async () => {
    this.setRemoteHistory([])

    if (this.notesController.firstSelectedNote) {
      this.setIsFetchingRemoteHistory(true)
      try {
        const initialRemoteHistory = await this.application.historyManager.remoteHistoryForItem(
          this.notesController.firstSelectedNote,
        )

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
      if (!this.notesController.firstSelectedNote) {
        return
      }

      const actionExtension = await this.application.actionsManager.loadExtensionInContextOfItem(
        ext,
        this.notesController.firstSelectedNote,
      )

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
    this.clearAllHistory()

    if (!this.notesController.firstSelectedNote) {
      return
    }

    this.setSessionHistory(
      sortRevisionListIntoGroups<NoteHistoryEntry>(
        this.application.historyManager.sessionHistoryForItem(
          this.notesController.firstSelectedNote,
        ) as NoteHistoryEntry[],
      ),
    )
    await this.fetchRemoteHistory()
    await this.fetchLegacyHistory()

    this.selectFirstRevision()
  }

  clearAllHistory = () => {
    this.remoteHistory = []
    this.sessionHistory = []
    this.legacyHistory = []
  }

  restoreRevision = (revision: NonNullable<SelectedRevision>) => {
    const originalNote = this.application.items.findItem<SNNote>(revision.payload.uuid)

    if (originalNote?.locked) {
      this.application.alertService.alert(STRING_RESTORE_LOCKED_ATTEMPT).catch(console.error)
      return
    }

    confirmDialog({
      text: "Are you sure you want to replace the current note's contents with what you see in this preview?",
      confirmButtonStyle: 'danger',
    })
      .then((confirmed) => {
        if (!originalNote) {
          throw new Error('Original note not found.')
        }

        if (confirmed) {
          this.application.mutator
            .changeAndSaveItem(
              originalNote,
              (mutator) => {
                mutator.setCustomContent(revision.payload.content)
              },
              true,
              PayloadEmitSource.RemoteRetrieved,
            )
            .catch(console.error)
          this.dismissModal()
        }
      })
      .catch(console.error)
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

  deleteRemoteRevision = (revisionEntry: RevisionListEntry) => {
    this.application.alertService
      .confirm(
        'Are you sure you want to delete this revision?',
        'Delete revision?',
        'Delete revision',
        ButtonType.Danger,
        'Cancel',
      )
      .then((shouldDelete) => {
        if (shouldDelete && this.notesController.firstSelectedNote) {
          this.setIsDeletingRevision(true)

          this.application.historyManager
            .deleteRemoteRevision(this.notesController.firstSelectedNote, revisionEntry)
            .then(async (res) => {
              if (res.error?.message) {
                throw new Error(res.error.message)
              }

              const remoteHistory = this.flattenedRemoteHistory

              if (!remoteHistory) {
                return
              }

              const currentEntryIndex = remoteHistory.findIndex((entry) => entry?.uuid === revisionEntry.uuid)

              const previousEntry = remoteHistory[currentEntryIndex - 1]
              const nextEntry = remoteHistory[currentEntryIndex + 1]

              await this.fetchRemoteHistory()

              const selectedEntry = this.selectedEntry as RevisionListEntry

              if (!selectedEntry?.uuid || selectedEntry?.uuid !== revisionEntry.uuid) {
                return
              }

              if (previousEntry) {
                void this.selectRemoteRevision(previousEntry)
              }

              if (nextEntry) {
                void this.selectRemoteRevision(nextEntry)
              }
            })
            .catch(console.error)
            .finally(() => {
              this.setIsDeletingRevision(false)
            })
        }
      })
      .catch(console.error)
  }
}
