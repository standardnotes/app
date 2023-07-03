import { WebApplication } from '@/Application/WebApplication'
import { MutationType, NoteMutator, SNNote } from '@standardnotes/models'
import { InfoStrings } from '@standardnotes/snjs'
import { Deferred } from '@standardnotes/utils'
import { EditorSaveTimeoutDebounce } from '../Components/NoteView/Controller/EditorSaveTimeoutDebounce'

const NotePreviewCharLimit = 160

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

  private saveTimeout?: ReturnType<typeof setTimeout>

  constructor(private application: WebApplication, private item: SNNote) {}

  setItem(item: SNNote) {
    this.item = item
  }

  deinit() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    if (this.savingLocallyPromise) {
      this.savingLocallyPromise.reject()
    }
    this.savingLocallyPromise = null
    this.saveTimeout = undefined
    ;(this.application as unknown) = undefined
    ;(this.item as unknown) = undefined
  }

  public async saveAndAwaitLocalPropagation(params: NoteSaveFunctionParams): Promise<void> {
    this.savingLocallyPromise = Deferred<void>()

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }

    const noDebounce = params.bypassDebouncer || this.application.noAccount()

    const syncDebouceMs = noDebounce
      ? EditorSaveTimeoutDebounce.ImmediateChange
      : this.application.isNativeMobileWeb()
      ? EditorSaveTimeoutDebounce.NativeMobileWeb
      : EditorSaveTimeoutDebounce.Desktop

    return new Promise((resolve) => {
      this.saveTimeout = setTimeout(() => {
        void this.undebouncedSave({
          ...params,
          onLocalPropagationComplete: () => {
            if (this.savingLocallyPromise) {
              this.savingLocallyPromise.resolve()
            }
            resolve()
          },
        })
      }, syncDebouceMs)
    })
  }

  private async undebouncedSave(params: NoteSaveFunctionParams): Promise<void> {
    if (!this.application.items.findItem(this.item.uuid)) {
      void this.application.alertService.alert(InfoStrings.InvalidNote)
      return
    }

    await this.application.mutator.changeItem(
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

    void this.application.sync.sync().then(() => {
      params.onRemoteSyncComplete?.()
    })

    params.onLocalPropagationComplete?.()
  }
}
