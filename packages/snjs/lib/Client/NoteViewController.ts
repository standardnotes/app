import {
  NoteMutator,
  SNNote,
  SNTag,
  NoteContent,
  DecryptedItemInterface,
  PayloadEmitSource,
} from '@standardnotes/models'
import { removeFromArray } from '@standardnotes/utils'
import { ContentType } from '@standardnotes/common'
import { UuidString } from '@Lib/Types/UuidString'
import { SNApplication } from '../Application/Application'
import {
  STRING_SAVING_WHILE_DOCUMENT_HIDDEN,
  STRING_INVALID_NOTE,
  NOTE_PREVIEW_CHAR_LIMIT,
  STRING_ELLIPSES,
  SAVE_TIMEOUT_NO_DEBOUNCE,
  SAVE_TIMEOUT_DEBOUNCE,
} from './Types'
import { ItemViewControllerInterface } from './ItemViewControllerInterface'
import { TemplateNoteViewControllerOptions } from './TemplateNoteViewControllerOptions'

export type EditorValues = {
  title: string
  text: string
}

export class NoteViewController implements ItemViewControllerInterface {
  public item!: SNNote
  public dealloced = false
  private innerValueChangeObservers: ((note: SNNote, source: PayloadEmitSource) => void)[] = []
  private removeStreamObserver?: () => void
  public isTemplateNote = false
  private saveTimeout?: ReturnType<typeof setTimeout>
  private defaultTitle: string | undefined
  private defaultTag: UuidString | undefined
  public runtimeId = `${Math.random()}`

  constructor(
    private application: SNApplication,
    item?: SNNote,
    templateNoteOptions?: TemplateNoteViewControllerOptions,
  ) {
    if (item) {
      this.item = item
    }

    if (templateNoteOptions) {
      this.defaultTitle = templateNoteOptions.title
      this.defaultTag = templateNoteOptions.tag
    }
  }

  deinit(): void {
    this.dealloced = true
    this.removeStreamObserver?.()
    ;(this.removeStreamObserver as unknown) = undefined
    ;(this.application as unknown) = undefined
    ;(this.item as unknown) = undefined

    this.innerValueChangeObservers.length = 0

    this.saveTimeout = undefined
  }

  async initialize(addTagHierarchy: boolean): Promise<void> {
    if (!this.item) {
      const note = this.application.mutator.createTemplateItem<NoteContent, SNNote>(ContentType.Note, {
        text: '',
        title: this.defaultTitle || '',
        references: [],
      })

      this.isTemplateNote = true
      this.item = note

      if (this.defaultTag) {
        const tag = this.application.items.findItem(this.defaultTag) as SNTag
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
    this.removeStreamObserver = this.application.streamItems<SNNote>(
      ContentType.Note,
      ({ changed, inserted, source }) => {
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
      },
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
   * @param dontUpdatePreviews Whether this change should update the note's plain and HTML
   * preview.
   * @param customMutate A custom mutator function.
   */
  public async save(dto: {
    editorValues: EditorValues
    bypassDebouncer?: boolean
    isUserModified?: boolean
    dontUpdatePreviews?: boolean
    customMutate?: (mutator: NoteMutator) => void
  }): Promise<void> {
    const title = dto.editorValues.title
    const text = dto.editorValues.text
    const isTemplate = this.isTemplateNote

    if (typeof document !== 'undefined' && document.hidden) {
      void this.application.alertService.alert(STRING_SAVING_WHILE_DOCUMENT_HIDDEN)
      return
    }

    if (isTemplate) {
      await this.insertTemplatedNote()
    }

    if (!this.application.items.findItem(this.item.uuid)) {
      void this.application.alertService.alert(STRING_INVALID_NOTE)
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

        if (!dto.dontUpdatePreviews) {
          const noteText = text || ''
          const truncate = noteText.length > NOTE_PREVIEW_CHAR_LIMIT
          const substring = noteText.substring(0, NOTE_PREVIEW_CHAR_LIMIT)
          const previewPlain = substring + (truncate ? STRING_ELLIPSES : '')

          // eslint-disable-next-line camelcase
          noteMutator.preview_plain = previewPlain
          // eslint-disable-next-line camelcase
          noteMutator.preview_html = undefined
        }
      },
      dto.isUserModified,
    )

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }

    const noDebounce = dto.bypassDebouncer || this.application.noAccount()
    const syncDebouceMs = noDebounce ? SAVE_TIMEOUT_NO_DEBOUNCE : SAVE_TIMEOUT_DEBOUNCE
    this.saveTimeout = setTimeout(() => {
      void this.application.sync.sync()
    }, syncDebouceMs)
  }
}
