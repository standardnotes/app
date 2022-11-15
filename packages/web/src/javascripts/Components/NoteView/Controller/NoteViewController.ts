import { NoteType, noteTypeForEditorIdentifier } from '@standardnotes/features'
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
import { SNApplication, UuidString } from '@standardnotes/snjs'
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
    private application: SNApplication,
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

      const editorIdentifier =
        this.defaultTag?.preferences?.editorIdentifier ||
        this.application.componentManager.getDefaultEditor()?.identifier

      const noteType = editorIdentifier ? noteTypeForEditorIdentifier(editorIdentifier) : NoteType.Unknown

      const defaultEditor = editorIdentifier
        ? this.application.componentManager.componentWithIdentifier(editorIdentifier)
        : undefined

      const note = this.application.mutator.createTemplateItem<NoteContent, SNNote>(
        ContentType.Note,
        {
          text: '',
          title: this.templateNoteOptions?.title || '',
          noteType: defaultEditor?.noteType || noteType,
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

  public async save(dto: {
    title?: string
    text?: string
    bypassDebouncer?: boolean
    isUserModified?: boolean
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

    const noDebounce = dto.bypassDebouncer || this.application.noAccount()

    const syncDebouceMs = noDebounce
      ? EditorSaveTimeoutDebounce.ImmediateChange
      : this.application.isNativeMobileWeb()
      ? EditorSaveTimeoutDebounce.NativeMobileWeb
      : EditorSaveTimeoutDebounce.Desktop

    this.saveTimeout = setTimeout(() => {
      void this.undebouncedSave(dto)
    }, syncDebouceMs)
  }

  private async undebouncedSave(dto: {
    title?: string
    text?: string
    bypassDebouncer?: boolean
    isUserModified?: boolean
    dontGeneratePreviews?: boolean
    previews?: { previewPlain: string; previewHtml?: string }
    customMutate?: (mutator: NoteMutator) => void
  }): Promise<void> {
    log(LoggingDomain.NoteView, 'Saving note', dto)

    const isTemplate = this.isTemplateNote

    if (typeof document !== 'undefined' && document.hidden) {
      void this.application.alertService.alert(InfoStrings.SavingWhileDocumentHidden)
      return
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
        if (dto.customMutate) {
          dto.customMutate(noteMutator)
        }

        if (dto.title != undefined) {
          noteMutator.title = dto.title
        }

        if (dto.text != undefined) {
          noteMutator.text = dto.text
        }

        if (dto.previews) {
          noteMutator.preview_plain = dto.previews.previewPlain
          noteMutator.preview_html = dto.previews.previewHtml
        } else if (!dto.dontGeneratePreviews && dto.text != undefined) {
          const noteText = dto.text || ''
          const truncate = noteText.length > NotePreviewCharLimit
          const substring = noteText.substring(0, NotePreviewCharLimit)
          const previewPlain = substring + (truncate ? StringEllipses : '')
          noteMutator.preview_plain = previewPlain
          noteMutator.preview_html = undefined
        }
      },
      dto.isUserModified,
    )

    void this.application.sync.sync()
  }
}
