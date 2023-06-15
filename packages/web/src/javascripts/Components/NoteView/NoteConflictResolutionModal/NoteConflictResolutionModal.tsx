import { NoteType, SNNote, classNames } from '@standardnotes/snjs'
import Modal, { ModalAction } from '../../Modal/Modal'
import { MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { useApplication } from '../../ApplicationProvider'
import { confirmDialog } from '@standardnotes/ui-services'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import { useNoteAttributes } from '../../NotesOptions/NoteAttributes'
import CheckIndicator from '../../Checkbox/CheckIndicator'
import ModalDialogButtons from '../../Modal/ModalDialogButtons'
import {
  Select,
  SelectArrow,
  SelectItem,
  SelectList,
  Toolbar,
  ToolbarItem,
  useSelectStore,
  useToolbarStore,
} from '@ariakit/react'
import Popover from '../../Popover/Popover'
import Icon from '../../Icon/Icon'
import Button from '../../Button/Button'
import Spinner from '../../Spinner/Spinner'
import Switch from '../../Switch/Switch'
import StyledTooltip from '../../StyledTooltip/StyledTooltip'
import { DiffView } from './DiffView'
import { NoteContent } from './NoteContent'

const ConflictListItem = ({
  isSelected,
  onClick,
  title,
  note,
  disabled,
}: {
  isSelected: boolean
  disabled: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
  title: string
  note: SNNote
}) => {
  const application = useApplication()
  const { words, characters, paragraphs, dateLastModified, dateCreated, format } = useNoteAttributes(application, note)

  return (
    <button
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      className={classNames(
        'flex w-full select-none flex-col border-l-2 bg-transparent px-3 py-2.5 text-left text-sm text-text',
        isSelected ? 'border-info bg-info-backdrop' : 'border-transparent',
        disabled
          ? 'cursor-not-allowed opacity-75'
          : 'cursor-pointer hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none',
      )}
      onClick={onClick}
      data-selected={isSelected}
      disabled={disabled}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <CheckIndicator checked={isSelected} />
        <div className="font-semibold">{title}</div>
      </div>
      <div className="text-sm text-neutral lg:text-xs">
        {typeof words === 'number' && (format === 'txt' || format === 'md') ? (
          <div className="mb-1">
            {words} words · {characters} characters · {paragraphs} paragraphs
          </div>
        ) : null}
        <div className="mb-1">
          <div className="mb-0.5 font-semibold">Last modified</div> {dateLastModified}
        </div>
        <div className="mb-1">
          <div className="mb-0.5 font-semibold">Created</div> {dateCreated}
        </div>
        <div>
          <div className="mb-0.5 font-semibold">Note ID</div> {note.uuid}
        </div>
      </div>
    </button>
  )
}

type ConflictAction = 'move-to-trash' | 'delete-permanently'
type MultipleSelectionMode = 'preview' | 'diff'

const NoteConflictResolutionModal = ({
  currentNote,
  conflictedNotes,
  close,
}: {
  currentNote: SNNote
  conflictedNotes: SNNote[]
  close: () => void
}) => {
  const allVersions = useMemo(() => [currentNote].concat(conflictedNotes), [conflictedNotes, currentNote])

  const application = useApplication()
  const [selectedVersions, setSelectedVersions] = useState([currentNote.uuid])

  const selectedNotes = useMemo(() => {
    return allVersions.filter((note) => selectedVersions.includes(note.uuid))
  }, [allVersions, selectedVersions])

  const trashNote = useCallback(
    async (note: SNNote) => {
      await application.mutator
        .changeItem(note, (mutator) => {
          mutator.trashed = true
          mutator.conflictOf = undefined
        })
        .catch(console.error)
      setSelectedVersions([allVersions[0].uuid])
    },
    [allVersions, application.mutator],
  )

  const deleteNotePermanently = useCallback(
    async (note: SNNote) => {
      await application.mutator
        .deleteItem(note)
        .catch(console.error)
        .then(() => {
          setSelectedVersions([allVersions[0].uuid])
        })
    },
    [allVersions, application.mutator],
  )

  const [selectedAction, setSelectionAction] = useState<ConflictAction>('move-to-trash')
  const selectStore = useSelectStore({
    value: selectedAction,
    setValue: (value) => setSelectionAction(value as ConflictAction),
  })
  const [isPerformingAction, setIsPerformingAction] = useState(false)

  const keepOnlySelectedNote = useCallback(async () => {
    if (selectedNotes.length !== 1) {
      return
    }

    const shouldDeletePermanently = selectedAction === 'delete-permanently'

    const confirmDialogText = `This will keep only the selected version and ${
      shouldDeletePermanently ? 'delete the other versions permanently.' : 'move the other versions to trash.'
    } Are you sure?`

    if (
      await confirmDialog({
        title: 'Keep only selected version?',
        text: confirmDialogText,
        confirmButtonStyle: 'danger',
      })
    ) {
      const nonSelectedNotes = allVersions.filter((note) => note.uuid !== selectedNotes[0].uuid)
      selectStore.hide()
      setIsPerformingAction(true)
      await Promise.all(
        nonSelectedNotes.map((note) => (shouldDeletePermanently ? deleteNotePermanently(note) : trashNote(note))),
      )
      await application.mutator.changeItem(selectedNotes[0], (mutator) => {
        mutator.conflictOf = undefined
      })
      setIsPerformingAction(false)
      void application.getViewControllerManager().selectionController.selectItem(selectedNotes[0].uuid, true)
      void application.sync.sync()
      close()
    }
  }, [allVersions, application, close, deleteNotePermanently, selectStore, selectedAction, selectedNotes, trashNote])

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)
  const actions = useMemo(
    (): ModalAction[] => [
      {
        label: 'Cancel',
        onClick: close,
        type: 'cancel',
        mobileSlot: 'left',
      },
    ],
    [close],
  )

  const listRef = useRef<HTMLDivElement>(null)
  useListKeyboardNavigation(listRef)

  const [selectedMobileTab, setSelectedMobileTab] = useState<'list' | 'content'>('list')

  const toolbarStore = useToolbarStore()
  const isSelectOpen = selectStore.useState('open')
  const [selectAnchor, setSelectAnchor] = useState<HTMLButtonElement | null>(null)

  const [multipleSelectionMode, setMultipleSelectionMode] = useState<MultipleSelectionMode>(
    isMobileScreen ? 'diff' : 'preview',
  )
  const isPreviewMode = multipleSelectionMode === 'preview'
  useEffect(() => {
    if (selectedNotes.length !== 2) {
      setMultipleSelectionMode('preview')
    }

    if (isMobileScreen && selectedNotes.length === 2) {
      setMultipleSelectionMode('diff')
    }
  }, [isMobileScreen, selectedNotes.length])
  const showSuperConversionInfo = selectedNotes.some((note) => note.noteType === NoteType.Super) && !isPreviewMode
  const [compareSuperMarkdown, setCompareSuperMarkdown] = useState(true)

  return (
    <Modal
      title="Resolve conflicts"
      className={{
        content: 'md:h-full md:w-[70vw]',
        description: 'flex flex-col overflow-x-hidden md:flex-row',
      }}
      actions={actions}
      close={close}
      customFooter={
        <ModalDialogButtons className={selectedNotes.length > 1 ? 'hidden md:flex' : ''}>
          <Button className="mr-auto hidden md:inline-block" onClick={close} disabled={isPerformingAction}>
            Cancel
          </Button>
          {selectedNotes.length === 1 && (
            <Toolbar className="flex w-full items-stretch text-info-contrast md:w-auto" store={toolbarStore}>
              <ToolbarItem
                onClick={keepOnlySelectedNote}
                className="flex-grow rounded rounded-r-none bg-info px-3 py-1.5 text-base font-bold hover:brightness-110 focus-visible:brightness-110 lg:text-sm"
                disabled={isPerformingAction}
              >
                {isPerformingAction ? (
                  <>
                    <Spinner className="h-4 w-4 border-info-contrast" />
                  </>
                ) : (
                  <>Keep selected, {selectedAction === 'move-to-trash' ? 'trash others' : 'delete others'}</>
                )}
              </ToolbarItem>
              <Select
                ref={setSelectAnchor}
                render={
                  <ToolbarItem
                    className="rounded rounded-l-none border-l border-border bg-info py-1.5 px-3 hover:brightness-110 focus-visible:brightness-110"
                    disabled={isPerformingAction}
                  >
                    <SelectArrow className={isSelectOpen ? 'block rotate-180' : ''} />
                  </ToolbarItem>
                }
                store={selectStore}
              />
              <Popover
                title="Conflict options"
                open={isSelectOpen}
                anchorElement={selectAnchor}
                className="z-modal py-1"
                offset={0}
              >
                <SelectList className="cursor-pointer" store={selectStore}>
                  <SelectItem className="px-2.5 py-1.5 hover:bg-contrast" value="move-to-trash">
                    <div className="flex items-center gap-1 font-bold">
                      {selectedAction === 'move-to-trash' && <Icon type="check-bold" size="small" />}
                      Move others to trash
                    </div>
                    <div className="text-neutral">
                      Only the selected version will be kept; others will be moved to trash.
                    </div>
                  </SelectItem>
                  <SelectItem className="px-2.5 py-1.5 hover:bg-contrast" value="delete-permanently">
                    <div className="flex items-center gap-1 font-bold">
                      {selectedAction === 'delete-permanently' && <Icon type="check-bold" size="small" />}
                      Delete others permanently
                    </div>
                    <div className="text-neutral">
                      Only the selected version will be kept; others will be deleted permanently.
                    </div>
                  </SelectItem>
                </SelectList>
              </Popover>
            </Toolbar>
          )}
        </ModalDialogButtons>
      }
    >
      <div className="flex border-b border-border md:hidden">
        <button
          className={classNames(
            'relative cursor-pointer border-0 bg-default px-3 py-2.5 text-sm focus:shadow-inner',
            selectedMobileTab === 'list' ? 'font-medium text-info shadow-bottom' : 'text-text',
          )}
          onClick={() => {
            setSelectedMobileTab('list')
          }}
        >
          List
        </button>
        <button
          className={classNames(
            'relative cursor-pointer border-0 bg-default px-3 py-2.5 text-sm focus:shadow-inner',
            selectedMobileTab === 'content' ? 'font-medium text-info shadow-bottom' : 'text-text',
          )}
          onClick={() => {
            setSelectedMobileTab('content')
          }}
        >
          Content
        </button>
      </div>
      <div
        className={classNames(
          'w-full overflow-y-auto border-r border-border py-1.5 md:flex md:w-auto md:min-w-60 md:flex-col',
          selectedMobileTab !== 'list' && 'hidden md:flex',
        )}
        ref={listRef}
      >
        {allVersions.map((note, index) => (
          <ConflictListItem
            disabled={isPerformingAction}
            isSelected={selectedVersions.includes(note.uuid)}
            onClick={(event) => {
              if (event.ctrlKey || event.metaKey || isMobileScreen) {
                setSelectedVersions((versions) => {
                  if (!versions.includes(note.uuid)) {
                    return versions.length > 1 ? versions.slice(1).concat(note.uuid) : versions.concat(note.uuid)
                  }

                  return versions.length > 1 ? versions.filter((version) => version !== note.uuid) : versions
                })
              } else {
                setSelectedVersions([note.uuid])
              }
              setSelectedMobileTab('content')
            }}
            key={note.uuid}
            title={index === 0 ? 'Current version' : `Version ${index + 1}`}
            note={note}
          />
        ))}
      </div>
      <div
        className={classNames(
          'flex w-full flex-grow flex-col overflow-hidden',
          selectedMobileTab !== 'content' && 'hidden md:flex',
        )}
      >
        {isPreviewMode && (
          <div
            className={classNames(
              'min-h-0 w-full flex-grow divide-x divide-border pb-0.5',
              isMobileScreen ? 'flex' : 'grid grid-rows-1',
            )}
            style={!isMobileScreen ? { gridTemplateColumns: `repeat(${selectedNotes.length}, 1fr)` } : undefined}
          >
            {selectedNotes.map((note) => (
              <NoteContent note={note} key={note.uuid} />
            ))}
          </div>
        )}
        {!isPreviewMode && selectedNotes.length === 2 && (
          <DiffView selectedNotes={selectedNotes} convertSuperToMarkdown={compareSuperMarkdown} />
        )}
        {selectedNotes.length === 2 && (
          <div className="flex min-h-11 items-center justify-center gap-2 border-t border-border px-4 py-1.5">
            {!isMobileScreen && (
              <>
                <div className={showSuperConversionInfo ? 'ml-9' : ''}>Preview Mode</div>
                <Switch
                  checked={!isPreviewMode}
                  onChange={function (checked: boolean): void {
                    setMultipleSelectionMode(checked ? 'diff' : 'preview')
                  }}
                />
              </>
            )}
            <div>Diff Mode</div>
            {showSuperConversionInfo && (
              <StyledTooltip
                className="!z-modal !max-w-[50ch]"
                label={
                  <>
                    <div className="mb-2">
                      Super notes use JSON under the hood to create rich and flexible documents. While neatly organized,
                      it's not ideal to read or compare manually. Instead, this diff compares a Markdown rendition of
                      the notes.
                    </div>
                    <label className="mb-1 flex select-none items-center gap-2">
                      <Switch
                        checked={!compareSuperMarkdown}
                        onChange={(checked) => setCompareSuperMarkdown(!checked)}
                      />
                      Compare JSON instead
                    </label>
                  </>
                }
                showOnMobile
                portal={false}
              >
                <button className="rounded-full p-1 hover:bg-contrast">
                  <Icon type="info" className="text-neutral" />
                </button>
              </StyledTooltip>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default NoteConflictResolutionModal
