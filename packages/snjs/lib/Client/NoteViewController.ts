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
import { removeFromArray } from '@standardnotes/utils'
import { ContentType } from '@standardnotes/common'
import { UuidString } from '@Lib/Types/UuidString'
import { SNApplication } from '../Application/Application'
import { ItemViewControllerInterface } from './ItemViewControllerInterface'
import { TemplateNoteViewControllerOptions } from './TemplateNoteViewControllerOptions'
import { EditorSaveTimeoutDebounce } from './EditorSaveTimeoutDebounce'

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

    this.needsInit = false

    const addTagHierarchy = this.application.getPreference(PrefKey.NoteAddToParentFolders, true)

    if (!this.item) {
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

  /**
   * @param bypassDebouncer Calling save will debounce by default. You can pass true to save
   * immediately.
   * @param isUserModified This field determines if the item will be saved as a user
   * modification, thus updating the user modified date displayed in the UI
   * @param dontGeneratePreviews Whether this change should update the note's plain and HTML
   * preview.
   * @param customMutate A custom mutator function.
   */
  public async save(dto: {
    editorValues: EditorValues
    bypassDebouncer?: boolean
    isUserModified?: boolean
    dontGeneratePreviews?: boolean
    previews?: { previewPlain: string; previewHtml?: string }
    customMutate?: (mutator: NoteMutator) => void
  }): Promise<void> {
    if (this.needsInit) {
      await this.initialize()
    }

    const title = dto.editorValues.title
    const text = dto.editorValues.text
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
        noteMutator.title = title
        noteMutator.text = text

        if (dto.previews) {
          noteMutator.preview_plain = dto.previews.previewPlain
          noteMutator.preview_html = dto.previews.previewHtml
        } else if (!dto.dontGeneratePreviews) {
          const noteText = text || ''
          const truncate = noteText.length > NotePreviewCharLimit
          const substring = noteText.substring(0, NotePreviewCharLimit)
          const previewPlain = substring + (truncate ? StringEllipses : '')
          noteMutator.preview_plain = previewPlain
          noteMutator.preview_html = undefined
        }
      },
      dto.isUserModified,
    )

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
      void this.application.sync.sync()
    }, syncDebouceMs)
  }
}
