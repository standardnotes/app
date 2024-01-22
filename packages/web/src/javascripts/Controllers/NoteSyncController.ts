import { MutationType, NoteMutator, SNNote } from '@standardnotes/models'
import {
  AlertService,
  InfoStrings,
  ItemManagerInterface,
  MutatorClientInterface,
  SessionsClientInterface,
  SyncMode,
  SyncServiceInterface,
} from '@standardnotes/snjs'
import { Deferred } from '@standardnotes/utils'
import { EditorSaveTimeoutDebounce } from '../Components/NoteView/Controller/EditorSaveTimeoutDebounce'
import { IsNativeMobileWeb } from '@standardnotes/ui-services'
import { LargeNoteThreshold } from '@/Constants/Constants'
import { NoteStatus } from '@/Components/NoteView/NoteStatusIndicator'
import { action, makeObservable, observable, runInAction } from 'mobx'

const NotePreviewCharLimit = 160
const MinimumStatusChangeDuration = 400

export type NoteSaveFunctionParams = {
  title?: string
  text?: string
  bypassDebouncer?: boolean
  isUserModified?: boolean
  dontGeneratePreviews?: boolean
  previews?: { previewPlain: string; previewHtml?: string }
  customMutate?: (mutator: NoteMutator) => void
  onLocalPropagationComplete?: () => void
}

export class NoteSyncController {
  savingLocallyPromise: ReturnType<typeof Deferred<void>> | null = null

  private syncTimeout?: ReturnType<typeof setTimeout>
  private largeNoteSyncTimeout?: ReturnType<typeof setTimeout>
  private statusChangeTimeout?: ReturnType<typeof setTimeout>

  status: NoteStatus | undefined = undefined

  constructor(
    private item: SNNote,
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sessions: SessionsClientInterface,
    private sync: SyncServiceInterface,
    private alerts: AlertService,
    private _isNativeMobileWeb: IsNativeMobileWeb,
  ) {
    makeObservable(this, {
      status: observable,
      setStatus: action,
    })
  }

  setStatus(status: NoteStatus, wait = true) {
    if (this.statusChangeTimeout) {
      clearTimeout(this.statusChangeTimeout)
    }
    if (wait) {
      this.statusChangeTimeout = setTimeout(() => {
        runInAction(() => {
          this.status = status
        })
      }, MinimumStatusChangeDuration)
    } else {
      this.status = status
    }
  }

  showSavingStatus() {
    this.setStatus(
      {
        type: 'saving',
        message: 'Saving…',
      },
      false,
    )
  }

  showAllChangesSavedStatus() {
    this.setStatus({
      type: 'saved',
      message: 'All changes saved' + (this.sessions.isSignedOut() ? ' offline' : ''),
    })
  }

  showWaitingToSyncLargeNoteStatus() {
    this.setStatus(
      {
        type: 'waiting',
        message: 'Note is too large',
        description: 'It will be synced less often. Changes will be saved offline normally.',
      },
      false,
    )
  }

  showErrorStatus(error?: NoteStatus) {
    if (!error) {
      error = {
        type: 'error',
        message: 'Sync Unreachable',
        description: 'Changes saved offline',
      }
    }
    this.setStatus(error)
  }

  setItem(item: SNNote) {
    this.item = item
  }

  deinit() {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout)
    }
    if (this.largeNoteSyncTimeout) {
      clearTimeout(this.largeNoteSyncTimeout)
    }
    if (this.statusChangeTimeout) {
      clearTimeout(this.statusChangeTimeout)
    }
    if (this.savingLocallyPromise) {
      this.savingLocallyPromise.reject()
    }
    this.savingLocallyPromise = null
    this.largeNoteSyncTimeout = undefined
    this.syncTimeout = undefined
    this.status = undefined
    this.statusChangeTimeout = undefined
    ;(this.item as unknown) = undefined
  }

  private isLargeNote(text: string): boolean {
    const textByteSize = new Blob([text]).size
    return textByteSize > LargeNoteThreshold
  }

  public async saveAndAwaitLocalPropagation(params: NoteSaveFunctionParams): Promise<void> {
    this.savingLocallyPromise = Deferred<void>()

    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout)
    }

    const noDebounce = params.bypassDebouncer || this.sessions.isSignedOut()
    const syncDebounceMs = noDebounce
      ? EditorSaveTimeoutDebounce.ImmediateChange
      : this._isNativeMobileWeb.execute().getValue()
      ? EditorSaveTimeoutDebounce.NativeMobileWeb
      : EditorSaveTimeoutDebounce.Desktop

    return new Promise((resolve) => {
      const isLargeNote = this.isLargeNote(params.text ? params.text : this.item.text)

      if (isLargeNote) {
        this.showWaitingToSyncLargeNoteStatus()
        this.queueLargeNoteSyncIfNeeded()
      }

      this.syncTimeout = setTimeout(() => {
        void this.undebouncedMutateAndSync({
          ...params,
          localOnly: isLargeNote,
          onLocalPropagationComplete: () => {
            if (this.savingLocallyPromise) {
              this.savingLocallyPromise.resolve()
            }
            resolve()
          },
        })
      }, syncDebounceMs)
    })
  }

  private queueLargeNoteSyncIfNeeded(): void {
    const isAlreadyAQueuedLargeNoteSync = this.largeNoteSyncTimeout !== undefined

    if (!isAlreadyAQueuedLargeNoteSync) {
      const isSignedIn = this.sessions.isSignedIn()
      const timeout = isSignedIn ? EditorSaveTimeoutDebounce.LargeNote : EditorSaveTimeoutDebounce.ImmediateChange

      this.largeNoteSyncTimeout = setTimeout(() => {
        this.largeNoteSyncTimeout = undefined
        void this.performSyncOfLargeItem()
      }, timeout)
    }
  }

  private async performSyncOfLargeItem(): Promise<void> {
    const item = this.items.findItem(this.item.uuid)
    if (!item || !item.dirty) {
      return
    }

    void this.sync.sync()
  }

  private async undebouncedMutateAndSync(params: NoteSaveFunctionParams & { localOnly: boolean }): Promise<void> {
    if (!this.items.findItem(this.item.uuid)) {
      void this.alerts.alert(InfoStrings.InvalidNote)
      return
    }

    await this.mutator.changeItem(
      this.item,
      (mutator) => {
        const noteMutator = mutator as NoteMutator
        if (params.customMutate) {
          params.customMutate(noteMutator)
        }

        if (params.title != undefined) {
          noteMutator.title = params.title
        }

        if (params.text != undefined) {
          noteMutator.text = params.text
        }

        if (params.previews) {
          noteMutator.preview_plain = params.previews.previewPlain
          noteMutator.preview_html = params.previews.previewHtml
        } else if (!params.dontGeneratePreviews && params.text != undefined) {
          const noteText = params.text || ''
          const truncate = noteText.length > NotePreviewCharLimit
          const substring = noteText.substring(0, NotePreviewCharLimit)
          const previewPlain = substring + (truncate ? '...' : '')
          noteMutator.preview_plain = previewPlain
          noteMutator.preview_html = undefined
        }
      },
      params.isUserModified ? MutationType.UpdateUserTimestamps : MutationType.NoUpdateUserTimestamps,
    )

    void this.sync.sync({ mode: params.localOnly ? SyncMode.LocalOnly : undefined })

    this.queueLargeNoteSyncIfNeeded()

    params.onLocalPropagationComplete?.()
  }

  public syncOnlyIfLargeNote(): void {
    const isLargeNote = this.isLargeNote(this.item.text)
    if (isLargeNote) {
      void this.performSyncOfLargeItem()
    }
  }
}
