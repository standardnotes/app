import { MutationType, NoteMutator, SNNote } from '@standardnotes/models'
import {
  AlertService,
  InfoStrings,
  ItemManagerInterface,
  MutatorClientInterface,
  SessionsClientInterface,
  SyncServiceInterface,
} from '@standardnotes/snjs'
import { Deferred } from '@standardnotes/utils'
import { EditorSaveTimeoutDebounce } from '../Components/NoteView/Controller/EditorSaveTimeoutDebounce'
import { IsNativeMobileWeb } from '@standardnotes/ui-services'
import { BYTES_IN_ONE_MEGABYTE } from '@/Constants/Constants'

const NotePreviewCharLimit = 160
const LargeNoteThreshold = 2 * BYTES_IN_ONE_MEGABYTE

export type NoteSaveFunctionParams = {
  title?: string
  text?: string
  bypassDebouncer?: boolean
  isUserModified?: boolean
  dontGeneratePreviews?: boolean
  previews?: { previewPlain: string; previewHtml?: string }
  customMutate?: (mutator: NoteMutator) => void
  onLocalPropagationComplete?: () => void
  onRemoteSyncComplete?: () => void
}

export class NoteSyncController {
  savingLocallyPromise: ReturnType<typeof Deferred<void>> | null = null

  private localSaveTimeout?: ReturnType<typeof setTimeout>
  private remoteSaveTimeout?: ReturnType<typeof setTimeout>

  constructor(
    private item: SNNote,
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sessions: SessionsClientInterface,
    private sync: SyncServiceInterface,
    private alerts: AlertService,
    private _isNativeMobileWeb: IsNativeMobileWeb,
  ) {}

  setItem(item: SNNote) {
    this.item = item
  }

  deinit() {
    if (this.localSaveTimeout) {
      clearTimeout(this.localSaveTimeout)
    }
    if (this.savingLocallyPromise) {
      this.savingLocallyPromise.reject()
    }
    this.savingLocallyPromise = null
    this.localSaveTimeout = undefined
    ;(this.item as unknown) = undefined
  }

  public async saveAndAwaitLocalPropagation(params: NoteSaveFunctionParams): Promise<void> {
    this.savingLocallyPromise = Deferred<void>()

    if (this.localSaveTimeout) {
      clearTimeout(this.localSaveTimeout)
    }
    if (this.remoteSaveTimeout) {
      clearTimeout(this.remoteSaveTimeout)
    }

    const noDebounce = params.bypassDebouncer || this.sessions.isSignedOut()

    const textByteSize = new Blob([params.text ? params.text : this.item.text]).size

    const isLargeNote = textByteSize > LargeNoteThreshold

    const localSaveDebouceMs = noDebounce
      ? EditorSaveTimeoutDebounce.ImmediateChange
      : this._isNativeMobileWeb.execute().getValue()
      ? EditorSaveTimeoutDebounce.NativeMobileWeb
      : EditorSaveTimeoutDebounce.Desktop

    const remoteSaveDebounceMs = isLargeNote ? EditorSaveTimeoutDebounce.LargeNote : localSaveDebouceMs

    return new Promise((resolve) => {
      this.localSaveTimeout = setTimeout(() => {
        void this.undebouncedSave({
          ...params,
          onLocalPropagationComplete: () => {
            if (this.savingLocallyPromise) {
              this.savingLocallyPromise.resolve()
            }
            resolve()
          },
        })
      }, localSaveDebouceMs)
      this.remoteSaveTimeout = setTimeout(() => {
        void this.sync.sync().then(() => {
          params.onRemoteSyncComplete?.()
        })
      }, remoteSaveDebounceMs)
    })
  }

  private async undebouncedSave(params: NoteSaveFunctionParams): Promise<void> {
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

    params.onLocalPropagationComplete?.()
  }
}
