import { WebApplication } from '@/Application/Application'
import { noteTypeForEditorIdentifier } from '@standardnotes/features'
import { InfoStrings } from '@standardnotes/services'
import {
  NoteMutator,
  SNNote,
  SNTag,
  NoteContent,
  DecryptedItemInterface,
  PayloadEmitSource,
  PrefKey,
} from '@standardnotes/models'
import { UuidString } from '@standardnotes/snjs'
import { removeFromArray } from '@standardnotes/utils'
import { ContentType } from '@standardnotes/common'
import { ItemViewControllerInterface } from './ItemViewControllerInterface'
import { TemplateNoteViewControllerOptions } from './TemplateNoteViewControllerOptions'
import { EditorSaveTimeoutDebounce } from './EditorSaveTimeoutDebounce'
import { log, LoggingDomain } from '@/Logging'

export type EditorValues = {
  title: string
  text: string
}

const StringEllipses = '...'
const NotePreviewCharLimit = 160

export class NoteViewController implements ItemViewControllerInterface {
  public item!: SNNote
  public dealloced = false
  private innerValueChangeObservers: ((note: SNNote, source: PayloadEmitSource) => void)[] = []
  private disposers: (() => void)[] = []
  public isTemplateNote = false
  private saveTimeout?: ReturnType<typeof setTimeout>
  private defaultTagUuid: UuidString | undefined
  private defaultTag?: SNTag
  public runtimeId = `${Math.random()}`
  public needsInit = true

  constructor(
    private application: WebApplication,
    item?: SNNote,
    public templateNoteOptions?: TemplateNoteViewControllerOptions,
  ) {
    if (item) {
      this.item = item
    }

    if (templateNoteOptions) {
      this.defaultTagUuid = templateNoteOptions.tag
    }

    if (this.defaultTagUuid) {
      this.defaultTag = this.application.items.findItem(this.defaultTagUuid) as SNTag
    }
  }

  deinit(): void {
    this.dealloced = true
    for (const disposer of this.disposers) {
      disposer()
    }
    this.disposers.length = 0
    ;(this.application as unknown) = undefined
    ;(this.item as unknown) = undefined

    this.innerValueChangeObservers.length = 0

    this.saveTimeout = undefined
  }

  async initialize(): Promise<void> {
    if (!this.needsInit) {
      throw Error('NoteViewController already initialized')
    }

    log(LoggingDomain.NoteView, 'Initializing NoteViewController')

    this.needsInit = false

    const addTagHierarchy = this.application.getPreference(PrefKey.NoteAddToParentFolders, true)

    if (!this.item) {
      log(LoggingDomain.NoteView, 'Initializing as template note')

      const editorIdentifier = this.application.geDefaultEditorIdentifier(this.defaultTag)

      const noteType = noteTypeForEditorIdentifier(editorIdentifier)

      const note = this.application.mutator.createTemplateItem<NoteContent, SNNote>(
        ContentType.Note,
        {
          text: '',
          title: this.templateNoteOptions?.title || '',
          noteType: noteType,
          editorIdentifier: editorIdentifier,
          references: [],
        },
        {
          created_at: this.templateNoteOptions?.createdAt || new Date(),
        },
      )

      this.isTemplateNote = true
      this.item = note

      if (this.defaultTagUuid) {
        const tag = this.application.items.findItem(this.defaultTagUuid) as SNTag
        await this.application.items.addTagToNote(note, tag, addTagHierarchy)
      }

      this.notifyObservers(this.item, PayloadEmitSource.InitialObserverRegistrationPush)
    }

    this.streamItems()
  }

  private notifyObservers(note: SNNote, source: PayloadEmitSource): void {
    for (const observer of this.innerValueChangeObservers) {
      observer(note, source)
    }
  }

  private streamItems() {
    if (this.dealloced) {
      return
    }

    this.disposers.push(
      this.application.streamItems<SNNote>(ContentType.Note, ({ changed, inserted, source }) => {
        if (this.dealloced) {
          return
        }

        const notes = changed.concat(inserted)

        const matchingNote = notes.find((item) => {
          return item.uuid === this.item.uuid
        })

        if (matchingNote) {
          this.isTemplateNote = false
          this.item = matchingNote
          this.notifyObservers(matchingNote, source)
        }
      }),
    )
  }

  public insertTemplatedNote(): Promise<DecryptedItemInterface> {
    log(LoggingDomain.NoteView, 'Inserting template note')
    this.isTemplateNote = false
    return this.application.mutator.insertItem(this.item)
  }

  /**
   * Register to be notified when the controller's note's inner values change
   * (and thus a new object reference is created)
   */
  public addNoteInnerValueChangeObserver(callback: (note: SNNote, source: PayloadEmitSource) => void): () => void {
    this.innerValueChangeObservers.push(callback)

    if (this.item) {
      callback(this.item, PayloadEmitSource.InitialObserverRegistrationPush)
    }

    const thislessChangeObservers = this.innerValueChangeObservers
    return () => {
      removeFromArray(thislessChangeObservers, callback)
    }
  }

  public async saveAndAwaitLocalPropagation(params: {
    title?: string
    text?: string
    isUserModified: boolean
    bypassDebouncer?: boolean
    dontGeneratePreviews?: boolean
    previews?: { previewPlain: string; previewHtml?: string }
    customMutate?: (mutator: NoteMutator) => void
  }): Promise<void> {
    if (this.needsInit) {
      throw Error('NoteViewController not initialized')
    }

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
        void this.undebouncedSave({ ...params, onLocalPropagationComplete: resolve })
      }, syncDebouceMs)
    })
  }

  private async undebouncedSave(params: {
    title?: string
    text?: string
    bypassDebouncer?: boolean
    isUserModified?: boolean
    dontGeneratePreviews?: boolean
    previews?: { previewPlain: string; previewHtml?: string }
    customMutate?: (mutator: NoteMutator) => void
    onLocalPropagationComplete?: () => void
    onRemoteSyncComplete?: () => void
  }): Promise<void> {
    log(LoggingDomain.NoteView, 'Saving note', params)

    const isTemplate = this.isTemplateNote

    if (typeof document !== 'undefined' && document.hidden) {
      void this.application.alertService.alert(InfoStrings.SavingWhileDocumentHidden)
    }

    if (isTemplate) {
      await this.insertTemplatedNote()
    }

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
          const previewPlain = substring + (truncate ? StringEllipses : '')
          noteMutator.preview_plain = previewPlain
          noteMutator.preview_html = undefined
        }
      },
      params.isUserModified,
    )

    params.onLocalPropagationComplete?.()

    void this.application.sync.sync().then(() => {
      params.onRemoteSyncComplete?.()
    })
  }
}
