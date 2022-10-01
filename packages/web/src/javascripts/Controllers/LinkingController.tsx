import { WebApplication } from '@/Application/Application'
import { AppPaneId } from '@/Components/ResponsivePane/AppPaneMetadata'
import { ContentType, FileItem, IconType, InternalEventBus, SNNote, SNTag } from '@standardnotes/snjs'
import { action, computed, makeObservable, observable, reaction } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { FilesController } from './FilesController'
import { NavigationController } from './Navigation/NavigationController'
import { NotesController } from './NotesController'
import { NoteTagsController } from './NoteTagsController'
import { SelectedItemsController } from './SelectedItemsController'

export type LinkableItem = SNTag | SNNote | FileItem

export class LinkingController extends AbstractViewController {
  tags: SNTag[] = []
  files: FileItem[] = []
  notes: SNNote[] = []

  constructor(
    application: WebApplication,
    private notesController: NotesController,
    private noteTagsController: NoteTagsController,
    private filesController: FilesController,
    private navigationController: NavigationController,
    private selectionController: SelectedItemsController,
    eventBus: InternalEventBus,
  ) {
    super(application, eventBus)

    makeObservable(this, {
      tags: observable,
      files: observable,
      notes: observable,

      allLinkedItems: computed,

      reloadLinkedFiles: action,
      reloadLinkedTags: action,
      reloadLinkedNotes: action,
    })

    this.disposers.push(
      application.streamItems(ContentType.File, () => {
        this.reloadLinkedFiles()
      }),
      application.streamItems(ContentType.Tag, () => {
        this.reloadLinkedTags()
      }),
      application.streamItems(ContentType.Note, () => {
        this.reloadLinkedNotes()
      }),
    )

    this.disposers.push(
      reaction(
        () => notesController.selectedNotes,
        () => {
          this.reloadLinkedFiles()
          this.reloadLinkedTags()
          this.reloadLinkedNotes()
        },
      ),
    )
  }

  get allLinkedItems() {
    return [...this.tags, ...this.files, ...this.notes]
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

  reloadLinkedNotes() {
    this.notes = this.application.items.getDisplayableNotes().slice(0, 3)
  }

  getItemTitle = (item: LinkableItem) => {
    if (item instanceof SNTag) {
      const prefixTitle = this.application.items.getTagPrefixTitle(item)
      return (
        <>
          {prefixTitle && <span className="text-passive-1">{prefixTitle}</span>}
          {item.title}
        </>
      )
    }

    return <>{item.title}</>
  }

  getItemIcon = (item: LinkableItem): IconType => {
    switch (item.content_type) {
      case ContentType.Note:
        return 'notes'
      case ContentType.File:
        return 'file'
      default:
        return 'hashtag'
    }
  }

  activateItem = async (item: LinkableItem): Promise<AppPaneId | undefined> => {
    if (item instanceof SNTag) {
      await this.navigationController.setSelectedTag(item)
      return AppPaneId.Items
    }

    const { didSelect } = await this.selectionController.selectItem(item.uuid, true)
    if (didSelect) {
      return AppPaneId.Editor
    }

    return undefined
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
