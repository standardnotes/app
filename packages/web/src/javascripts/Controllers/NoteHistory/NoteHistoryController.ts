import { WebApplication } from '@/Application/WebApplication'
import { RevisionType } from '@/Components/RevisionHistoryModal/RevisionType'
import {
  LegacyHistoryEntry,
  ListGroup,
  RemoteRevisionListGroup,
  sortRevisionListIntoGroups,
} from '@/Components/RevisionHistoryModal/utils'
import { STRING_RESTORE_LOCKED_ATTEMPT } from '@/Constants/Strings'
import { confirmDialog } from '@standardnotes/ui-services'
import {
  Action,
  ActionVerb,
  ButtonType,
  HistoryEntry,
  NoteHistoryEntry,
  PayloadEmitSource,
  RevisionMetadata,
  SNNote,
} from '@standardnotes/snjs'
import { makeObservable, observable, action } from 'mobx'
import { SelectedItemsController } from '../SelectedItemsController'

type RemoteHistory = RemoteRevisionListGroup[]

type SessionHistory = ListGroup<NoteHistoryEntry>[]

type LegacyHistory = Action[]

type SelectedRevision = HistoryEntry | LegacyHistoryEntry | undefined

type SelectedEntry = RevisionMetadata | NoteHistoryEntry | Action | undefined

export enum RevisionContentState {
  Idle,
  Loading,
  Loaded,
  NotEntitled,
}

export class NoteHistoryController {
  remoteHistory: RemoteHistory = []
  isFetchingRemoteHistory = false
  sessionHistory: SessionHistory = []
  legacyHistory: LegacyHistory = []

  selectedRevision: SelectedRevision = undefined
  selectedEntry: SelectedEntry = undefined

  contentState = RevisionContentState.Idle

  currentTab = RevisionType.Remote

  constructor(
    private application: WebApplication,
    private note: SNNote,
    private selectionController: SelectedItemsController,
  ) {
    void this.fetchAllHistory()

    makeObservable(this, {
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

  setIsFetchingRemoteHistory = (value: boolean) => {
    this.isFetchingRemoteHistory = value
  }

  setContentState = (contentState: RevisionContentState) => {
    this.contentState = contentState
  }

  selectRemoteRevision = async (entry: RevisionMetadata) => {
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
      const remoteRevisionOrError = await this.application.getRevision.execute({
        itemUuid: this.note.uuid,
        revisionUuid: entry.uuid,
      })
      if (remoteRevisionOrError.isFailed()) {
        throw new Error(remoteRevisionOrError.getError())
      }
      const remoteRevision = remoteRevisionOrError.getValue()
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
    this.setContentState(RevisionContentState.Loaded)
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

  selectPrevOrNextRemoteRevision = (revisionEntry: RevisionMetadata) => {
    const currentIndex = this.flattenedRemoteHistory.findIndex((entry) => entry?.uuid === revisionEntry.uuid)

    const previousEntry = this.flattenedRemoteHistory[currentIndex - 1]
    const nextEntry = this.flattenedRemoteHistory[currentIndex + 1]

    if (previousEntry) {
      void this.selectRemoteRevision(previousEntry)
    } else if (nextEntry) {
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
        const revisionsListOrError = await this.application.listRevisions.execute({ itemUuid: this.note.uuid })
        if (revisionsListOrError.isFailed()) {
          throw new Error(revisionsListOrError.getError())
        }
        const revisionsList = revisionsListOrError.getValue()

        this.setRemoteHistory(sortRevisionListIntoGroups<RevisionMetadata>(revisionsList))
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
    }
  }

  restoreRevisionAsCopy = async (revision: NonNullable<SelectedRevision>) => {
    const originalNote = this.application.items.findSureItem<SNNote>(revision.payload.uuid)

    const duplicatedItem = await this.application.mutator.duplicateItem(originalNote, {
      ...revision.payload.content,
      title: revision.payload.content.title ? revision.payload.content.title + ' (copy)' : undefined,
    })

    this.selectionController.selectItem(duplicatedItem.uuid).catch(console.error)
  }

  deleteRemoteRevision = async (revisionEntry: RevisionMetadata) => {
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

    const deleteRevisionOrError = await this.application.deleteRevision.execute({
      itemUuid: this.note.uuid,
      revisionUuid: revisionEntry.uuid,
    })
    if (deleteRevisionOrError.isFailed()) {
      throw new Error(deleteRevisionOrError.getError())
    }

    this.clearSelection()

    this.selectPrevOrNextRemoteRevision(revisionEntry)

    await this.fetchRemoteHistory()
  }
}
