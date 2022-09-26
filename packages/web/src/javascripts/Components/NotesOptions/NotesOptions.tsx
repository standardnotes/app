import Icon from '@/Components/Icon/Icon'
import Switch from '@/Components/Switch/Switch'
import { observer } from 'mobx-react-lite'
import { useState, useEffect, useMemo, useCallback, FunctionComponent } from 'react'
import { Platform, SNApplication, SNComponent, SNNote } from '@standardnotes/snjs'
import { KeyboardModifier, sanitizeFileName } from '@standardnotes/ui-services'
import ChangeEditorOption from './ChangeEditorOption'
import { BYTES_IN_ONE_MEGABYTE } from '@/Constants/Constants'
import ListedActionsOption from './ListedActionsOption'
import AddTagOption from './AddTagOption'
import { addToast, dismissToast, ToastType } from '@standardnotes/toast'
import { NotesOptionsProps } from './NotesOptionsProps'
import { NotesController } from '@/Controllers/NotesController'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { getBase64FromBlob } from '@/Utils'
import { parseFileName } from '@standardnotes/filepicker'

type DeletePermanentlyButtonProps = {
  onClick: () => void
}

const DeletePermanentlyButton = ({ onClick }: DeletePermanentlyButtonProps) => (
  <button
    className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
    onClick={onClick}
  >
    <Icon type="close" className="mr-2 text-danger" />
    <span className="text-danger">Delete permanently</span>
  </button>
)

const iconClass = 'text-neutral mr-2'
const iconClassDanger = 'text-danger mr-2'
const iconClassWarning = 'text-warning mr-2'
const iconClassSuccess = 'text-success mr-2'

const getWordCount = (text: string) => {
  if (text.trim().length === 0) {
    return 0
  }
  return text.split(/\s+/).length
}

const getParagraphCount = (text: string) => {
  if (text.trim().length === 0) {
    return 0
  }
  return text.replace(/\n$/gm, '').split(/\n/).length
}

const countNoteAttributes = (text: string) => {
  try {
    JSON.parse(text)
    return {
      characters: 'N/A',
      words: 'N/A',
      paragraphs: 'N/A',
    }
  } catch {
    const characters = text.length
    const words = getWordCount(text)
    const paragraphs = getParagraphCount(text)

    return {
      characters,
      words,
      paragraphs,
    }
  }
}

const calculateReadTime = (words: number) => {
  const timeToRead = Math.round(words / 200)
  if (timeToRead === 0) {
    return '< 1 minute'
  } else {
    return `${timeToRead} ${timeToRead > 1 ? 'minutes' : 'minute'}`
  }
}

const NoteAttributes: FunctionComponent<{
  application: SNApplication
  note: SNNote
}> = ({ application, note }) => {
  const { words, characters, paragraphs } = useMemo(() => countNoteAttributes(note.text), [note.text])

  const readTime = useMemo(() => (typeof words === 'number' ? calculateReadTime(words) : 'N/A'), [words])

  const dateLastModified = useMemo(() => formatDateForContextMenu(note.userModifiedDate), [note.userModifiedDate])

  const dateCreated = useMemo(() => formatDateForContextMenu(note.created_at), [note.created_at])

  const editor = application.componentManager.editorForNote(note)
  const format = editor?.package_info?.file_type || 'txt'

  return (
    <div className="px-3 py-1.5 text-xs font-medium text-neutral">
      {typeof words === 'number' && (format === 'txt' || format === 'md') ? (
        <>
          <div className="mb-1">
            {words} words · {characters} characters · {paragraphs} paragraphs
          </div>
          <div className="mb-1">
            <span className="font-semibold">Read time:</span> {readTime}
          </div>
        </>
      ) : null}
      <div className="mb-1">
        <span className="font-semibold">Last modified:</span> {dateLastModified}
      </div>
      <div className="mb-1">
        <span className="font-semibold">Created:</span> {dateCreated}
      </div>
      <div>
        <span className="font-semibold">Note ID:</span> {note.uuid}
      </div>
    </div>
  )
}

const SpellcheckOptions: FunctionComponent<{
  editorForNote: SNComponent | undefined
  notesController: NotesController
  note: SNNote
}> = ({ editorForNote, notesController, note }) => {
  const spellcheckControllable = Boolean(!editorForNote || editorForNote.package_info.spellcheckControl)
  const noteSpellcheck = !spellcheckControllable
    ? true
    : note
    ? notesController.getSpellcheckStateForNote(note)
    : undefined

  return (
    <div className="flex flex-col">
      <button
        className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        onClick={() => {
          notesController.toggleGlobalSpellcheckForNote(note).catch(console.error)
        }}
        disabled={!spellcheckControllable}
      >
        <span className="flex items-center">
          <Icon type="notes" className={iconClass} />
          Spellcheck
        </span>
        <Switch className="px-0" checked={noteSpellcheck} disabled={!spellcheckControllable} />
      </button>
      {!spellcheckControllable && (
        <p className="px-3 py-1.5 text-xs">Spellcheck cannot be controlled for this editor.</p>
      )}
    </div>
  )
}

const NOTE_SIZE_WARNING_THRESHOLD = 0.5 * BYTES_IN_ONE_MEGABYTE

const NoteSizeWarning: FunctionComponent<{
  note: SNNote
}> = ({ note }) => {
  return new Blob([note.text]).size > NOTE_SIZE_WARNING_THRESHOLD ? (
    <>
      <HorizontalSeparator classes="my-2" />
      <div className="bg-warning-faded relative flex items-center px-3 py-3.5">
        <Icon type="warning" className="mr-3 flex-shrink-0 text-accessory-tint-3" />
        <div className="leading-140% max-w-80% select-none text-warning">
          This note may have trouble syncing to the mobile application due to its size.
        </div>
      </div>
    </>
  ) : null
}

const NotesOptions = ({
  application,
  navigationController,
  notesController,
  noteTagsController,
  historyModalController,
  closeMenu,
}: NotesOptionsProps) => {
  const [altKeyDown, setAltKeyDown] = useState(false)
  const { toggleAppPane } = useResponsiveAppPane()

  const toggleOn = (condition: (note: SNNote) => boolean) => {
    const notesMatchingAttribute = notes.filter(condition)
    const notesNotMatchingAttribute = notes.filter((note) => !condition(note))
    return notesMatchingAttribute.length > notesNotMatchingAttribute.length
  }

  const notes = notesController.selectedNotes
  const hidePreviews = toggleOn((note) => note.hidePreview)
  const locked = toggleOn((note) => note.locked)
  const protect = toggleOn((note) => note.protected)
  const archived = notes.some((note) => note.archived)
  const unarchived = notes.some((note) => !note.archived)
  const trashed = notes.some((note) => note.trashed)
  const notTrashed = notes.some((note) => !note.trashed)
  const pinned = notes.some((note) => note.pinned)
  const unpinned = notes.some((note) => !note.pinned)

  const editorForNote = useMemo(
    () => (notes[0] ? application.componentManager.editorForNote(notes[0]) : undefined),
    [application.componentManager, notes],
  )

  useEffect(() => {
    const removeAltKeyObserver = application.io.addKeyObserver({
      modifiers: [KeyboardModifier.Alt],
      onKeyDown: () => {
        setAltKeyDown(true)
      },
      onKeyUp: () => {
        setAltKeyDown(false)
      },
    })

    return () => {
      removeAltKeyObserver()
    }
  }, [application])

  const getNoteFormat = useCallback(
    (note: SNNote) => {
      const editor = application.componentManager.editorForNote(note)
      const format = editor?.package_info?.file_type || 'txt'
      return format
    },
    [application.componentManager],
  )

  const getNoteFileName = useCallback(
    (note: SNNote): string => {
      const format = getNoteFormat(note)
      return `${note.title}.${format}`
    },
    [getNoteFormat],
  )

  const getNoteBlob = useCallback(
    (note: SNNote) => {
      const format = getNoteFormat(note)
      let type: string
      switch (format) {
        case 'html':
          type = 'text/html'
          break
        case 'json':
          type = 'application/json'
          break
        case 'md':
          type = 'text/markdown'
          break
        default:
          type = 'text/plain'
          break
      }
      const blob = new Blob([note.text], {
        type,
      })
      return blob
    },
    [getNoteFormat],
  )

  const shareSelectedItems = useCallback(async () => {
    if (!application.isNativeMobileWeb()) {
      return
    }
    if (notes.length === 1) {
      const note = notes[0]
      const blob = getNoteBlob(note)
      const base64 = await getBase64FromBlob(blob)
      application.mobileDevice.shareBase64AsFile(base64, note.title)
      return
    }
    if (notes.length > 1) {
      const zippedDataBlob = await application.getArchiveService().zipData(
        notes.map((note) => {
          return {
            name: getNoteFileName(note),
            content: getNoteBlob(note),
          }
        }),
      )
      const zippedDataAsBase64 = await getBase64FromBlob(zippedDataBlob)
      application.mobileDevice.shareBase64AsFile(
        zippedDataAsBase64,
        `Standard Notes Export - ${application.getArchiveService().formattedDateForExports()}.zip`,
      )
    }
  }, [application, getNoteBlob, getNoteFileName, notes])

  const downloadSelectedItemsOnAndroid = useCallback(async () => {
    if (!application.isNativeMobileWeb() || application.platform !== Platform.Android) {
      return
    }
    if (notes.length === 1) {
      const note = notes[0]
      const blob = getNoteBlob(note)
      const base64 = await getBase64FromBlob(blob)
      const { name, ext } = parseFileName(getNoteFileName(note))
      const filename = `${sanitizeFileName(name)}.${ext}`
      const downloaded = await application.mobileDevice.downloadBase64AsFileOnAndroid(base64, filename)
      if (downloaded) {
        addToast({
          type: ToastType.Success,
          message: `Exported ${filename}`,
        })
      }
      return
    }
    if (notes.length > 1) {
      const zippedDataBlob = await application.getArchiveService().zipData(
        notes.map((note) => {
          return {
            name: getNoteFileName(note),
            content: getNoteBlob(note),
          }
        }),
      )
      const zippedDataAsBase64 = await getBase64FromBlob(zippedDataBlob)
      const filename = `Standard Notes Export - ${application.getArchiveService().formattedDateForExports()}.zip`
      const downloaded = await application.mobileDevice.downloadBase64AsFileOnAndroid(zippedDataAsBase64, filename)
      if (downloaded) {
        addToast({
          type: ToastType.Success,
          message: `Exported ${filename}`,
        })
      }
    }
  }, [application, getNoteBlob, getNoteFileName, notes])

  const downloadSelectedItems = useCallback(async () => {
    if (notes.length === 1) {
      const note = notes[0]
      const blob = getNoteBlob(note)
      application.getArchiveService().downloadData(blob, getNoteFileName(note))
      return
    }

    if (notes.length > 1) {
      const loadingToastId = addToast({
        type: ToastType.Loading,
        message: `Exporting ${notes.length} notes...`,
      })
      await application.getArchiveService().downloadDataAsZip(
        notes.map((note) => {
          return {
            name: getNoteFileName(note),
            content: getNoteBlob(note),
          }
        }),
      )
      dismissToast(loadingToastId)
      addToast({
        type: ToastType.Success,
        message: `Exported ${notes.length} notes`,
      })
    }
  }, [application, getNoteBlob, getNoteFileName, notes])

  const closeMenuAndToggleNotesList = useCallback(() => {
    toggleAppPane(AppPaneId.Items)
    closeMenu()
  }, [closeMenu, toggleAppPane])

  const duplicateSelectedItems = useCallback(async () => {
    await Promise.all(notes.map((note) => application.mutator.duplicateItem(note).catch(console.error)))
    closeMenuAndToggleNotesList()
  }, [application.mutator, closeMenuAndToggleNotesList, notes])

  const openRevisionHistoryModal = useCallback(() => {
    historyModalController.openModal(notesController.firstSelectedNote)
  }, [historyModalController, notesController.firstSelectedNote])

  return (
    <>
      {notes.length === 1 && (
        <>
          <button
            className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
            onClick={openRevisionHistoryModal}
          >
            <Icon type="history" className={iconClass} />
            Note history
          </button>
          <HorizontalSeparator classes="my-2" />
        </>
      )}
      <button
        className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        onClick={() => {
          notesController.setLockSelectedNotes(!locked)
        }}
      >
        <span className="flex items-center">
          <Icon type="pencil-off" className={iconClass} />
          Prevent editing
        </span>
        <Switch className="px-0" checked={locked} />
      </button>
      <button
        className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        onClick={() => {
          notesController.setHideSelectedNotePreviews(!hidePreviews)
        }}
      >
        <span className="flex items-center">
          <Icon type="rich-text" className={iconClass} />
          Show preview
        </span>
        <Switch className="px-0" checked={!hidePreviews} />
      </button>
      <button
        className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        onClick={() => {
          notesController.setProtectSelectedNotes(!protect).catch(console.error)
        }}
      >
        <span className="flex items-center">
          <Icon type="password" className={iconClass} />
          Password protect
        </span>
        <Switch className="px-0" checked={protect} />
      </button>
      {notes.length === 1 && (
        <>
          <HorizontalSeparator classes="my-2" />
          <ChangeEditorOption application={application} note={notes[0]} />
        </>
      )}
      <HorizontalSeparator classes="my-2" />
      {navigationController.tagsCount > 0 && (
        <AddTagOption
          navigationController={navigationController}
          notesController={notesController}
          noteTagsController={noteTagsController}
        />
      )}
      {unpinned && (
        <button
          className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
          onClick={() => {
            notesController.setPinSelectedNotes(true)
          }}
        >
          <Icon type="pin" className={iconClass} />
          Pin to top
        </button>
      )}
      {pinned && (
        <button
          className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
          onClick={() => {
            notesController.setPinSelectedNotes(false)
          }}
        >
          <Icon type="unpin" className={iconClass} />
          Unpin
        </button>
      )}
      <button
        className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        onClick={application.isNativeMobileWeb() ? shareSelectedItems : downloadSelectedItems}
      >
        <Icon type={application.platform === Platform.Android ? 'share' : 'download'} className={iconClass} />
        {application.platform === Platform.Android ? 'Share' : 'Export'}
      </button>
      {application.platform === Platform.Android && (
        <button
          className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
          onClick={downloadSelectedItemsOnAndroid}
        >
          <Icon type="download" className={iconClass} />
          Export
        </button>
      )}
      <button
        className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        onClick={duplicateSelectedItems}
      >
        <Icon type="copy" className={iconClass} />
        Duplicate
      </button>
      {unarchived && (
        <button
          className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
          onClick={async () => {
            await notesController.setArchiveSelectedNotes(true).catch(console.error)
            closeMenuAndToggleNotesList()
          }}
        >
          <Icon type="archive" className={iconClassWarning} />
          <span className="text-warning">Archive</span>
        </button>
      )}
      {archived && (
        <button
          className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
          onClick={async () => {
            await notesController.setArchiveSelectedNotes(false).catch(console.error)
            closeMenuAndToggleNotesList()
          }}
        >
          <Icon type="unarchive" className={iconClassWarning} />
          <span className="text-warning">Unarchive</span>
        </button>
      )}
      {notTrashed &&
        (altKeyDown ? (
          <DeletePermanentlyButton
            onClick={async () => {
              await notesController.deleteNotesPermanently()
              closeMenuAndToggleNotesList()
            }}
          />
        ) : (
          <button
            className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
            onClick={async () => {
              await notesController.setTrashSelectedNotes(true)
              closeMenuAndToggleNotesList()
            }}
          >
            <Icon type="trash" className={iconClassDanger} />
            <span className="text-danger">Move to trash</span>
          </button>
        ))}
      {trashed && (
        <>
          <button
            className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
            onClick={async () => {
              await notesController.setTrashSelectedNotes(false)
              closeMenuAndToggleNotesList()
            }}
          >
            <Icon type="restore" className={iconClassSuccess} />
            <span className="text-success">Restore</span>
          </button>
          <DeletePermanentlyButton
            onClick={async () => {
              await notesController.deleteNotesPermanently()
              closeMenuAndToggleNotesList()
            }}
          />
          <button
            className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
            onClick={async () => {
              await notesController.emptyTrash()
              closeMenuAndToggleNotesList()
            }}
          >
            <div className="flex items-start">
              <Icon type="trash-sweep" className="mr-2 text-danger" />
              <div className="flex-row">
                <div className="text-danger">Empty Trash</div>
                <div className="text-xs">{notesController.trashedNotesCount} notes in Trash</div>
              </div>
            </div>
          </button>
        </>
      )}
      {notes.length === 1 ? (
        <>
          <HorizontalSeparator classes="my-2" />
          <ListedActionsOption application={application} note={notes[0]} />
          <HorizontalSeparator classes="my-2" />
          <SpellcheckOptions editorForNote={editorForNote} notesController={notesController} note={notes[0]} />
          <HorizontalSeparator classes="my-2" />
          <NoteAttributes application={application} note={notes[0]} />
          <NoteSizeWarning note={notes[0]} />
        </>
      ) : null}
    </>
  )
}

export default observer(NotesOptions)
