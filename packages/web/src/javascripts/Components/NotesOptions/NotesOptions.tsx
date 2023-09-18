import Icon from '@/Components/Icon/Icon'
import { observer } from 'mobx-react-lite'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { NoteType, Platform, SNNote } from '@standardnotes/snjs'
import {
  CHANGE_EDITOR_WIDTH_COMMAND,
  OPEN_NOTE_HISTORY_COMMAND,
  PIN_NOTE_COMMAND,
  SHOW_HIDDEN_OPTIONS_KEYBOARD_COMMAND,
  STAR_NOTE_COMMAND,
  SUPER_EXPORT_HTML,
  SUPER_EXPORT_JSON,
  SUPER_EXPORT_MARKDOWN,
  SUPER_SHOW_MARKDOWN_PREVIEW,
} from '@standardnotes/ui-services'
import ChangeEditorOption from './ChangeEditorOption'
import ListedActionsOption from './Listed/ListedActionsOption'
import AddTagOption from './AddTagOption'
import { addToast, dismissToast, ToastType } from '@standardnotes/toast'
import { NotesOptionsProps } from './NotesOptionsProps'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'
import { AppPaneId } from '../Panes/AppPaneMetadata'
import { getNoteBlob, getNoteFileName } from '@/Utils/NoteExportUtils'
import { shareSelectedNotes } from '@/NativeMobileWeb/ShareSelectedNotes'
import { downloadSelectedNotesOnAndroid } from '@/NativeMobileWeb/DownloadSelectedNotesOnAndroid'
import ProtectedUnauthorizedLabel from '../ProtectedItemOverlay/ProtectedUnauthorizedLabel'
import { MenuItemIconSize } from '@/Constants/TailwindClassNames'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import { NoteAttributes } from './NoteAttributes'
import { SpellcheckOptions } from './SpellcheckOptions'
import { NoteSizeWarning } from './NoteSizeWarning'
import { useCommandService } from '../CommandProvider'
import { iconClass } from './ClassNames'
import SuperNoteOptions from './SuperNoteOptions'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'
import MenuItem from '../Menu/MenuItem'
import ModalOverlay from '../Modal/ModalOverlay'
import SuperExportModal from './SuperExportModal'
import { useApplication } from '../ApplicationProvider'
import { MutuallyExclusiveMediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import AddToVaultMenuOption from '../Vaults/AddToVaultMenuOption'
import Menu from '../Menu/Menu'
import Popover from '../Popover/Popover'

const iconSize = MenuItemIconSize
const iconClassDanger = `text-danger mr-2 ${iconSize}`
const iconClassWarning = `text-warning mr-2 ${iconSize}`
const iconClassSuccess = `text-success mr-2 ${iconSize}`

const NotesOptions = ({ notes, closeMenu }: NotesOptionsProps) => {
  const application = useApplication()

  const [altKeyDown, setAltKeyDown] = useState(false)
  const { toggleAppPane } = useResponsiveAppPane()
  const commandService = useCommandService()

  const markdownShortcut = useMemo(
    () => commandService.keyboardShortcutForCommand(SUPER_SHOW_MARKDOWN_PREVIEW),
    [commandService],
  )

  const toggleOn = (condition: (note: SNNote) => boolean) => {
    const notesMatchingAttribute = notes.filter(condition)
    const notesNotMatchingAttribute = notes.filter((note) => !condition(note))
    return notesMatchingAttribute.length > notesNotMatchingAttribute.length
  }

  const hidePreviews = toggleOn((note) => note.hidePreview)
  const locked = toggleOn((note) => note.locked)
  const protect = toggleOn((note) => note.protected)
  const archived = notes.some((note) => note.archived)
  const unarchived = notes.some((note) => !note.archived)
  const trashed = notes.some((note) => note.trashed)
  const notTrashed = notes.some((note) => !note.trashed)
  const pinned = notes.some((note) => note.pinned)
  const unpinned = notes.some((note) => !note.pinned)
  const starred = notes.some((note) => note.starred)

  const editorForNote = useMemo(
    () => (notes[0] ? application.componentManager.editorForNote(notes[0]) : undefined),
    [application.componentManager, notes],
  )

  useEffect(() => {
    const removeAltKeyObserver = application.keyboardService.addCommandHandler({
      command: SHOW_HIDDEN_OPTIONS_KEYBOARD_COMMAND,
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

  const [showExportSuperModal, setShowExportSuperModal] = useState(false)
  const closeSuperExportModal = useCallback(() => {
    setShowExportSuperModal(false)
  }, [])

  const downloadSelectedItems = useCallback(async () => {
    if (notes.length === 1) {
      const note = notes[0]
      const blob = getNoteBlob(application, note)
      application.archiveService.downloadData(blob, getNoteFileName(application, note))
      return
    }

    if (notes.length > 1) {
      const loadingToastId = addToast({
        type: ToastType.Loading,
        message: `Exporting ${notes.length} notes...`,
      })
      await application.archiveService.downloadDataAsZip(
        notes.map((note) => {
          return {
            name: getNoteFileName(application, note),
            content: getNoteBlob(application, note),
          }
        }),
      )
      dismissToast(loadingToastId)
      addToast({
        type: ToastType.Success,
        message: `Exported ${notes.length} notes`,
      })
    }
  }, [application, notes])

  const closeMenuAndToggleNotesList = useCallback(() => {
    const isMobileScreen = matchMedia(MutuallyExclusiveMediaQueryBreakpoints.sm).matches
    if (isMobileScreen) {
      toggleAppPane(AppPaneId.Items)
    }
    closeMenu()
  }, [closeMenu, toggleAppPane])

  const duplicateSelectedItems = useCallback(async () => {
    await Promise.all(
      notes.map((note) =>
        application.mutator
          .duplicateItem(note)
          .then((duplicated) =>
            addToast({
              type: ToastType.Regular,
              message: `Duplicated note "${duplicated.title}"`,
              actions: [
                {
                  label: 'Open',
                  handler: (toastId) => {
                    application.itemListController.selectItem(duplicated.uuid, true).catch(console.error)
                    dismissToast(toastId)
                  },
                },
              ],
              autoClose: true,
            }),
          )
          .catch(console.error),
      ),
    )
    void application.sync.sync()
    closeMenuAndToggleNotesList()
  }, [application.mutator, application.itemListController, application.sync, closeMenuAndToggleNotesList, notes])

  const openRevisionHistoryModal = useCallback(() => {
    application.historyModalController.openModal(application.notesController.firstSelectedNote)
  }, [application.historyModalController, application.notesController.firstSelectedNote])

  const historyShortcut = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(OPEN_NOTE_HISTORY_COMMAND),
    [application],
  )

  const pinShortcut = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(PIN_NOTE_COMMAND),
    [application],
  )

  const starShortcut = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(STAR_NOTE_COMMAND),
    [application],
  )

  const enableSuperMarkdownPreview = useCallback(() => {
    commandService.triggerCommand(SUPER_SHOW_MARKDOWN_PREVIEW)
  }, [commandService])

  const toggleLineWidthModal = useCallback(() => {
    application.keyboardService.triggerCommand(CHANGE_EDITOR_WIDTH_COMMAND)
  }, [application.keyboardService])
  const editorWidthShortcut = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(CHANGE_EDITOR_WIDTH_COMMAND),
    [application],
  )

  const superExportButtonRef = useRef<HTMLButtonElement>(null)
  const [isSuperExportMenuOpen, setIsSuperExportMenuOpen] = useState(false)

  const unauthorized = notes.some((note) => !application.isAuthorizedToRenderItem(note))
  if (unauthorized) {
    return <ProtectedUnauthorizedLabel />
  }

  const areSomeNotesInSharedVault = notes.some((note) => application.vaults.getItemVault(note)?.isSharedVaultListing())
  const areSomeNotesInReadonlySharedVault = notes.some((note) => {
    const vault = application.vaults.getItemVault(note)
    return vault?.isSharedVaultListing() && application.vaultUsers.isCurrentUserReadonlyVaultMember(vault)
  })
  const hasAdminPermissionForAllSharedNotes = notes.every((note) => {
    const vault = application.vaults.getItemVault(note)
    if (!vault?.isSharedVaultListing()) {
      return true
    }
    return application.vaultUsers.isCurrentUserSharedVaultAdmin(vault)
  })

  if (notes.length === 0) {
    return null
  }

  const isOnlySuperNoteSelected = notes.length === 1 && notes[0].noteType === NoteType.Super

  return (
    <>
      {notes.length === 1 && (
        <>
          <MenuItem onClick={openRevisionHistoryModal} disabled={areSomeNotesInReadonlySharedVault}>
            <Icon type="history" className={iconClass} />
            Note history
            {historyShortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={historyShortcut} />}
          </MenuItem>
          <HorizontalSeparator classes="my-2" />
          <MenuItem onClick={toggleLineWidthModal} disabled={areSomeNotesInReadonlySharedVault}>
            <Icon type="line-width" className={iconClass} />
            Editor width
            {editorWidthShortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={editorWidthShortcut} />}
          </MenuItem>
        </>
      )}
      <MenuSwitchButtonItem
        checked={locked}
        onChange={(locked) => {
          application.notesController.setLockSelectedNotes(locked)
        }}
        disabled={areSomeNotesInReadonlySharedVault}
      >
        <Icon type="pencil-off" className={iconClass} />
        Prevent editing
      </MenuSwitchButtonItem>
      <MenuSwitchButtonItem
        checked={!hidePreviews}
        onChange={(hidePreviews) => {
          application.notesController.setHideSelectedNotePreviews(!hidePreviews)
        }}
        disabled={areSomeNotesInReadonlySharedVault}
      >
        <Icon type="rich-text" className={iconClass} />
        Show preview
      </MenuSwitchButtonItem>
      <MenuSwitchButtonItem
        checked={protect}
        onChange={(protect) => {
          application.notesController.setProtectSelectedNotes(protect).catch(console.error)
        }}
        disabled={areSomeNotesInReadonlySharedVault}
      >
        <Icon type="lock" className={iconClass} />
        Password protect
      </MenuSwitchButtonItem>
      {notes.length === 1 && (
        <>
          <HorizontalSeparator classes="my-2" />
          <ChangeEditorOption
            iconClassName={iconClass}
            application={application}
            note={notes[0]}
            disabled={areSomeNotesInReadonlySharedVault}
          />
        </>
      )}
      <HorizontalSeparator classes="my-2" />

      {application.featuresController.isEntitledToVaults() && (
        <AddToVaultMenuOption iconClassName={iconClass} items={notes} disabled={!hasAdminPermissionForAllSharedNotes} />
      )}

      {application.navigationController.tagsCount > 0 && (
        <AddTagOption
          iconClassName={iconClass}
          navigationController={application.navigationController}
          selectedItems={notes}
          linkingController={application.linkingController}
          disabled={areSomeNotesInReadonlySharedVault}
        />
      )}
      <MenuItem
        onClick={() => {
          application.notesController.setStarSelectedNotes(!starred)
        }}
        disabled={areSomeNotesInReadonlySharedVault}
      >
        <Icon type="star" className={iconClass} />
        {starred ? 'Unstar' : 'Star'}
        {starShortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={starShortcut} />}
      </MenuItem>

      {unpinned && (
        <MenuItem
          onClick={() => {
            application.notesController.setPinSelectedNotes(true)
          }}
          disabled={areSomeNotesInReadonlySharedVault}
        >
          <Icon type="pin" className={iconClass} />
          Pin to top
          {pinShortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={pinShortcut} />}
        </MenuItem>
      )}
      {pinned && (
        <MenuItem
          onClick={() => {
            application.notesController.setPinSelectedNotes(false)
          }}
          disabled={areSomeNotesInReadonlySharedVault}
        >
          <Icon type="unpin" className={iconClass} />
          Unpin
          {pinShortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={pinShortcut} />}
        </MenuItem>
      )}
      {isOnlySuperNoteSelected ? (
        <>
          <MenuItem
            ref={superExportButtonRef}
            onClick={() => {
              setIsSuperExportMenuOpen((open) => !open)
            }}
          >
            <div className="flex items-center">
              <Icon type="download" className={iconClass} />
              Export
            </div>
            <Icon type="chevron-right" className="ml-auto text-neutral" />
          </MenuItem>
          <Popover
            title="Export note"
            side="left"
            align="start"
            open={isSuperExportMenuOpen}
            anchorElement={superExportButtonRef.current}
            togglePopover={() => {
              setIsSuperExportMenuOpen(!isSuperExportMenuOpen)
            }}
            className="py-1"
          >
            <Menu a11yLabel={'Super note export menu'} isOpen={isSuperExportMenuOpen}>
              <MenuItem onClick={() => commandService.triggerCommand(SUPER_EXPORT_JSON, notes[0].title)}>
                <Icon type="code" className={iconClass} />
                Export as JSON
              </MenuItem>
              <MenuItem onClick={() => commandService.triggerCommand(SUPER_EXPORT_MARKDOWN, notes[0].title)}>
                <Icon type="markdown" className={iconClass} />
                Export as Markdown
              </MenuItem>
              <MenuItem onClick={() => commandService.triggerCommand(SUPER_EXPORT_HTML, notes[0].title)}>
                <Icon type="rich-text" className={iconClass} />
                Export as HTML
              </MenuItem>
            </Menu>
          </Popover>
        </>
      ) : (
        <>
          <MenuItem
            onClick={() => {
              if (application.isNativeMobileWeb()) {
                void shareSelectedNotes(application, notes)
              } else {
                const hasSuperNote = notes.some((note) => note.noteType === NoteType.Super)

                if (hasSuperNote) {
                  setShowExportSuperModal(true)
                  return
                }

                void downloadSelectedItems()
              }
            }}
          >
            <Icon type={application.platform === Platform.Android ? 'share' : 'download'} className={iconClass} />
            {application.platform === Platform.Android ? 'Share' : 'Export'}
          </MenuItem>
          {application.platform === Platform.Android && (
            <MenuItem onClick={() => downloadSelectedNotesOnAndroid(application, notes)}>
              <Icon type="download" className={iconClass} />
              Export
            </MenuItem>
          )}
        </>
      )}
      <MenuItem onClick={duplicateSelectedItems} disabled={areSomeNotesInReadonlySharedVault}>
        <Icon type="copy" className={iconClass} />
        Duplicate
      </MenuItem>
      {unarchived && (
        <MenuItem
          onClick={async () => {
            await application.notesController.setArchiveSelectedNotes(true).catch(console.error)
            closeMenuAndToggleNotesList()
          }}
          disabled={areSomeNotesInReadonlySharedVault}
        >
          <Icon type="archive" className={iconClassWarning} />
          <span className="text-warning">Archive</span>
        </MenuItem>
      )}
      {archived && (
        <MenuItem
          onClick={async () => {
            await application.notesController.setArchiveSelectedNotes(false).catch(console.error)
            closeMenuAndToggleNotesList()
          }}
          disabled={areSomeNotesInReadonlySharedVault}
        >
          <Icon type="unarchive" className={iconClassWarning} />
          <span className="text-warning">Unarchive</span>
        </MenuItem>
      )}
      {notTrashed &&
        (altKeyDown ? (
          <MenuItem
            disabled={areSomeNotesInReadonlySharedVault}
            onClick={async () => {
              await application.notesController.deleteNotesPermanently()
              closeMenuAndToggleNotesList()
            }}
          >
            <Icon type="close" className="mr-2 text-danger" />
            <span className="text-danger">Delete permanently</span>
          </MenuItem>
        ) : (
          <MenuItem
            onClick={async () => {
              await application.notesController.setTrashSelectedNotes(true)
              closeMenuAndToggleNotesList()
            }}
            disabled={areSomeNotesInReadonlySharedVault}
          >
            <Icon type="trash" className={iconClassDanger} />
            <span className="text-danger">Move to trash</span>
          </MenuItem>
        ))}
      {trashed && (
        <>
          <MenuItem
            onClick={async () => {
              await application.notesController.setTrashSelectedNotes(false)
              closeMenuAndToggleNotesList()
            }}
            disabled={areSomeNotesInReadonlySharedVault}
          >
            <Icon type="restore" className={iconClassSuccess} />
            <span className="text-success">Restore</span>
          </MenuItem>
          <MenuItem
            disabled={areSomeNotesInReadonlySharedVault}
            onClick={async () => {
              await application.notesController.deleteNotesPermanently()
              closeMenuAndToggleNotesList()
            }}
          >
            <Icon type="close" className="mr-2 text-danger" />
            <span className="text-danger">Delete permanently</span>
          </MenuItem>
          <MenuItem
            onClick={async () => {
              await application.notesController.emptyTrash()
              closeMenuAndToggleNotesList()
            }}
            disabled={areSomeNotesInReadonlySharedVault}
          >
            <div className="flex items-start">
              <Icon type="trash-sweep" className="mr-2 text-danger" />
              <div className="flex-row">
                <div className="text-danger">Empty Trash</div>
                <div className="text-xs">{application.notesController.trashedNotesCount} notes in Trash</div>
              </div>
            </div>
          </MenuItem>
        </>
      )}

      {notes.length === 1 ? (
        <>
          {notes[0].noteType === NoteType.Super && (
            <SuperNoteOptions
              note={notes[0]}
              markdownShortcut={markdownShortcut}
              enableSuperMarkdownPreview={enableSuperMarkdownPreview}
            />
          )}

          {!areSomeNotesInSharedVault && (
            <>
              <HorizontalSeparator classes="my-2" />
              <ListedActionsOption iconClassName={iconClass} application={application} note={notes[0]} />
            </>
          )}

          <HorizontalSeparator classes="my-2" />

          {editorForNote && (
            <SpellcheckOptions
              editorForNote={editorForNote}
              notesController={application.notesController}
              note={notes[0]}
              disabled={areSomeNotesInReadonlySharedVault}
            />
          )}

          <HorizontalSeparator classes="my-2" />

          <NoteAttributes className="mb-2" application={application} note={notes[0]} />

          <NoteSizeWarning note={notes[0]} />
        </>
      ) : (
        <div className="h-2" />
      )}

      <ModalOverlay isOpen={showExportSuperModal} close={closeSuperExportModal}>
        <SuperExportModal exportNotes={downloadSelectedItems} close={closeSuperExportModal} />
      </ModalOverlay>
    </>
  )
}

export default observer(NotesOptions)
