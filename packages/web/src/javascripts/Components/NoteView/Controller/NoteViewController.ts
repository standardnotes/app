import { WebApplication } from '@/Application/WebApplication'
import { noteTypeForEditorIdentifier } from '@standardnotes/features'
import { SNNote, SNTag, NoteContent, DecryptedItemInterface, PayloadEmitSource, PrefKey } from '@standardnotes/models'
import { UuidString } from '@standardnotes/snjs'
import { removeFromArray } from '@standardnotes/utils'
import { ContentType } from '@standardnotes/common'
import { ItemViewControllerInterface } from './ItemViewControllerInterface'
import { TemplateNoteViewControllerOptions } from './TemplateNoteViewControllerOptions'
import { log, LoggingDomain } from '@/Logging'
import { NoteSaveFunctionParams, NoteSyncController } from '../../../Controllers/NoteSyncController'

export type EditorValues = {
  title: string
  text: string
}

export class NoteViewController implements ItemViewControllerInterface {
  public item!: SNNote
  public dealloced = false
  public isTemplateNote = false
  public runtimeId = `${Math.random()}`
  public needsInit = true

  private innerValueChangeObservers: ((note: SNNote, source: PayloadEmitSource) => void)[] = []
  private disposers: (() => void)[] = []
  private defaultTagUuid: UuidString | undefined
  private defaultTag?: SNTag

  private syncController!: NoteSyncController

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

    this.syncController = new NoteSyncController(this.application, this.item)
  }

  deinit(): void {
    if (!this.syncController.savingLocallyPromise) {
      this.performDeinitSafely()
      return
    }

    void this.syncController.savingLocallyPromise.promise.then(() => {
      this.performDeinitSafely()
    })
  }

  private performDeinitSafely(): void {
    this.dealloced = true

    for (const disposer of this.disposers) {
      disposer()
    }
    this.disposers.length = 0
    ;(this.application as unknown) = undefined
    ;(this.item as unknown) = undefined

    this.innerValueChangeObservers.length = 0
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
      this.syncController.setItem(this.item)

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

  public async saveAndAwaitLocalPropagation(params: NoteSaveFunctionParams): Promise<void> {
    if (this.needsInit) {
      throw Error('NoteViewController not initialized')
    }

    log(LoggingDomain.NoteView, 'Saving note', params)

    const isTemplate = this.isTemplateNote

    if (isTemplate) {
      await this.insertTemplatedNote()
    }

    await this.syncController.saveAndAwaitLocalPropagation(params)
  }
}
