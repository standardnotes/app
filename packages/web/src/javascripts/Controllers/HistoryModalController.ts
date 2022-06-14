import { WebApplication } from '@/Application/Application'
import { RevisionListTab } from '@/Components/RevisionHistoryModal/RevisionListTabType'
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

type RemoteHistory = RemoteRevisionListGroup[] | undefined

type SessionHistory = ListGroup<NoteHistoryEntry>[] | undefined

type LegacyHistory = Action[] | undefined

type SelectedRevision = HistoryEntry | LegacyHistoryEntry | undefined

export class HistoryModalController extends AbstractViewController {
  showRevisionHistoryModal = false

  remoteHistory: RemoteHistory = undefined
  isFetchingRemoteHistory = false
  sessionHistory: SessionHistory = undefined
  legacyHistory: LegacyHistory = undefined

  selectedRevision: SelectedRevision = undefined

  currentTab = RevisionListTab.Remote

  override deinit(): void {
    super.deinit()
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
      setCurrentTab: action,
    })
  }

  setSelectedRevision = (revision: SelectedRevision) => {
    this.selectedRevision = revision
  }

  setCurrentTab = (tab: RevisionListTab) => {
    this.currentTab = tab
  }

  setShowRevisionHistoryModal = (showRevisionHistoryModal: boolean) => {
    this.showRevisionHistoryModal = showRevisionHistoryModal
    void this.fetchAllHistory()
  }

  dismissModal = () => {
    this.setShowRevisionHistoryModal(false)
    this.clearAllHistory()
  }

  setIsFetchingRemoteHistory = (value: boolean) => {
    this.isFetchingRemoteHistory = value
  }

  setRemoteHistory = (remoteHistory: RemoteHistory) => {
    this.remoteHistory = remoteHistory
  }

  fetchRemoteHistory = async () => {
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
  }

  clearAllHistory = () => {
    this.remoteHistory = undefined
    this.sessionHistory = undefined
    this.legacyHistory = undefined
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
}
