import { WebApplication } from '@/Application/Application'
import { ContentType, FileItem, InternalEventBus, SNNote, SNTag } from '@standardnotes/snjs'
import { action, makeObservable, observable, reaction } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { FilesController } from './FilesController'
import { NotesController } from './NotesController'
import { NoteTagsController } from './NoteTagsController'

export type LinkableItem = SNTag | SNNote | FileItem

export class LinkingController extends AbstractViewController {
  tags: SNTag[] = []
  files: FileItem[] = []

  constructor(
    application: WebApplication,
    private notesController: NotesController,
    private noteTagsController: NoteTagsController,
    private filesController: FilesController,
    eventBus: InternalEventBus,
  ) {
    super(application, eventBus)

    makeObservable(this, {
      tags: observable,
      files: observable,

      reloadLinkedFiles: action,
      reloadLinkedTags: action,
    })

    this.disposers.push(
      application.streamItems(ContentType.File, () => {
        this.reloadLinkedFiles()
      }),
    )

    this.disposers.push(
      reaction(
        () => notesController.selectedNotes,
        () => {
          this.reloadLinkedFiles()
          this.reloadLinkedTags()
        },
      ),
    )

    this.disposers.push(
      this.application.streamItems(ContentType.Tag, () => {
        this.reloadLinkedTags()
      }),
    )
  }

  reloadLinkedFiles() {
    const note = this.notesController.firstSelectedNote
    if (note) {
      this.files = this.application.items.getFilesForNote(note)
    }
  }

  reloadLinkedTags() {
    const activeNote = this.notesController.firstSelectedNote

    if (activeNote) {
      const tags = this.application.items.getSortedTagsForNote(activeNote)
      this.tags = tags
    }
  }

  unlinkItem = (item: LinkableItem) => {
    if (item instanceof SNTag) {
      void this.noteTagsController.removeTagFromActiveNote(item)
    }

    if (item instanceof FileItem) {
      void this.filesController.detachFileFromNote(item)
    }
  }
}
