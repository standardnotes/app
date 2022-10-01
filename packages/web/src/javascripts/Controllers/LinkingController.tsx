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

  getTitleForLinkedTag = (item: LinkableItem) => {
    const isTag = item instanceof SNTag

    if (!isTag) {
      return
    }

    const titlePrefix = this.application.items.getTagPrefixTitle(item)
    const longTitle = this.application.items.getTagLongTitle(item)
    return {
      titlePrefix,
      longTitle,
    }
  }

  getLinkedItemIcon = (item: LinkableItem): [IconType, string] => {
    if (item instanceof SNNote) {
      const editorForNote = this.application.componentManager.editorForNote(item)
      const [icon, tint] = this.application.iconsController.getIconAndTintForNoteType(
        editorForNote?.package_info.note_type,
      )
      const className = `text-accessory-tint-${tint}`
      return [icon, className]
    }

    if (item instanceof FileItem) {
      const icon = this.application.iconsController.getIconForFileType(item.mimeType)
      return [icon, 'text-info']
    }

    return ['hashtag', 'text-info']
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
