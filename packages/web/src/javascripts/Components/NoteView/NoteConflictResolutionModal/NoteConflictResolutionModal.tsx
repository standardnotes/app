import { NoteType, SNNote, classNames } from '@standardnotes/snjs'
import Modal, { ModalAction } from '../../Modal/Modal'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useApplication } from '../../ApplicationProvider'
import { confirmDialog } from '@standardnotes/ui-services'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import ModalDialogButtons from '../../Modal/ModalDialogButtons'
import {
  Checkbox,
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
import { ReadonlyNoteContent } from '../ReadonlyNoteContent'
import { ConflictListItem } from './ConflictListItem'

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
        .then(() => application.sync.sync())
        .catch(console.error)
        .then(() => {
          setSelectedVersions([allVersions[0].uuid])
        })
    },
    [allVersions, application.mutator, application.sync],
  )

  const [selectedAction, setSelectionAction] = useState<ConflictAction>('move-to-trash')
  const selectStore = useSelectStore({
    value: selectedAction,
    setValue: (value) => setSelectionAction(value as ConflictAction),
  })
  const [isPerformingAction, setIsPerformingAction] = useState(false)

  const keepOnlySelected = useCallback(async () => {
    const shouldDeletePermanently = selectedAction === 'delete-permanently'

    const confirmDialogText = `This will keep only the selected versions and ${
      shouldDeletePermanently ? 'delete the other versions permanently.' : 'move the other versions to the trash.'
    } Are you sure?`

    if (
      await confirmDialog({
        title: 'Keep only selected versions?',
        text: confirmDialogText,
        confirmButtonStyle: 'danger',
      })
    ) {
      const nonSelectedNotes = allVersions.filter((note) => !selectedVersions.includes(note.uuid))
      selectStore.hide()
      setIsPerformingAction(true)
      await Promise.all(
        nonSelectedNotes.map((note) => (shouldDeletePermanently ? deleteNotePermanently(note) : trashNote(note))),
      )
      await application.mutator.changeItems(selectedNotes, (mutator) => {
        mutator.conflictOf = undefined
      })
      setIsPerformingAction(false)
      void application.itemListController.selectItem(selectedNotes[0].uuid, true)
      void application.sync.sync()
      close()
    }
  }, [
    allVersions,
    application,
    close,
    deleteNotePermanently,
    selectStore,
    selectedAction,
    selectedNotes,
    selectedVersions,
    trashNote,
  ])

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

  const [listElement, setListElement] = useState<HTMLDivElement | null>(null)
  useListKeyboardNavigation(listElement)

  const [selectedMobileTab, setSelectedMobileTab] = useState<'list' | 'preview'>('list')

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

  const [comparisonScrollPos, setComparisonScrollPos] = useState(0)
  const [shouldSyncComparisonScroll, setShouldSyncComparisonScroll] = useState(true)
  const onScroll = useCallback(({ target }: { target: EventTarget | null }) => {
    setComparisonScrollPos((target as HTMLElement).scrollTop)
  }, [])

  return (
    <Modal
      title="Resolve conflicts"
      className="flex flex-col overflow-x-hidden md:flex-row"
      actions={actions}
      close={close}
      customFooter={
        <ModalDialogButtons className={selectedNotes.length > 1 ? 'hidden md:flex' : ''}>
          <Button className="mr-auto hidden md:inline-block" onClick={close} disabled={isPerformingAction}>
            Cancel
          </Button>
          <Toolbar className="flex w-full items-stretch text-info-contrast md:w-auto" store={toolbarStore}>
            <ToolbarItem
              onClick={keepOnlySelected}
              className="flex-grow rounded rounded-r-none bg-info px-3 py-1.5 text-base font-bold ring-info ring-offset-2 ring-offset-default hover:brightness-110 focus:ring-0 focus-visible:ring-2 focus-visible:brightness-110 lg:text-sm"
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
                  className="relative rounded rounded-l-none bg-info px-3 py-1.5 ring-info hover:brightness-110 focus:ring-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-default focus-visible:brightness-110"
                  disabled={isPerformingAction}
                >
                  <SelectArrow className="block rotate-180" />
                  <div className="absolute left-0 top-0 h-full w-[2px] bg-info brightness-[.85]" />
                </ToolbarItem>
              }
              store={selectStore}
            />
            <Popover
              title="Conflict options"
              open={isSelectOpen}
              togglePopover={selectStore.toggle}
              anchorElement={selectAnchor}
              overrideZIndex="z-modal"
              side="top"
              align="end"
              offset={4}
              hideOnClickInModal
            >
              <SelectList
                className="cursor-pointer divide-y divide-border [&>[data-active-item]]:bg-passive-5"
                store={selectStore}
              >
                <SelectItem className="px-2.5 py-2 hover:bg-passive-5" value="move-to-trash">
                  <div className="flex items-center gap-1 text-sm font-bold text-text">
                    {selectedAction === 'move-to-trash' ? (
                      <Icon type="check-bold" size="small" />
                    ) : (
                      <div className="h-3.5 w-3.5" />
                    )}
                    Move others to trash
                  </div>
                  <div className="ml-4.5 text-neutral">
                    Only the selected version will be kept; others will be moved to trash.
                  </div>
                </SelectItem>
                <SelectItem className="px-2.5 py-2 hover:bg-passive-5" value="delete-permanently">
                  <div className="flex items-center gap-1 text-sm font-bold text-text">
                    {selectedAction === 'delete-permanently' ? (
                      <Icon type="check-bold" size="small" />
                    ) : (
                      <div className="h-3.5 w-3.5" />
                    )}
                    Delete others permanently
                  </div>
                  <div className="ml-4.5 text-neutral">
                    Only the selected version will be kept; others will be deleted permanently.
                  </div>
                </SelectItem>
              </SelectList>
            </Popover>
          </Toolbar>
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
            selectedMobileTab === 'preview' ? 'font-medium text-info shadow-bottom' : 'text-text',
          )}
          onClick={() => {
            setSelectedMobileTab('preview')
          }}
        >
          Preview
        </button>
      </div>
      <div
        className={classNames(
          'w-full overflow-y-auto border-r border-border py-1.5 md:flex md:w-auto md:min-w-60 md:flex-col',
          selectedMobileTab !== 'list' && 'hidden md:flex',
        )}
        ref={setListElement}
      >
        {allVersions.map((note, index) => (
          <ConflictListItem
            disabled={isPerformingAction}
            isSelected={selectedVersions.includes(note.uuid)}
            onClick={() => {
              setSelectedVersions((versions) => {
                if (!versions.includes(note.uuid)) {
                  return versions.length > 1 ? versions.slice(1).concat(note.uuid) : versions.concat(note.uuid)
                }

                return versions.length > 1 ? versions.filter((version) => version !== note.uuid) : versions
              })
              setSelectedMobileTab('preview')
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
          selectedMobileTab !== 'preview' && 'hidden md:flex',
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
              <ReadonlyNoteContent
                note={note}
                content={note.content}
                key={note.uuid}
                scrollPos={comparisonScrollPos}
                shouldSyncScroll={shouldSyncComparisonScroll}
                onScroll={onScroll}
              />
            ))}
          </div>
        )}
        {!isPreviewMode && selectedNotes.length === 2 && (
          <DiffView selectedNotes={selectedNotes} convertSuperToMarkdown={compareSuperMarkdown} />
        )}
        {selectedNotes.length === 2 && (
          <div className="flex min-h-11 items-center justify-center gap-2 border-t border-border px-4 py-1.5">
            {isPreviewMode && (
              <StyledTooltip
                className="!z-modal !max-w-[50ch]"
                label={shouldSyncComparisonScroll ? 'Scrolling is synced' : 'Scrolling is not synced. Click to sync.'}
                showOnMobile
              >
                <div className="relative rounded-full p-1 hover:bg-contrast">
                  <Icon type={shouldSyncComparisonScroll ? 'link' : 'link-off'} className="text-neutral" />
                  <Checkbox
                    className="absolute bottom-0 left-0 right-0 top-0 cursor-pointer opacity-0"
                    checked={shouldSyncComparisonScroll}
                    onChange={() => setShouldSyncComparisonScroll((shouldSync) => !shouldSync)}
                  />
                </div>
              </StyledTooltip>
            )}
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
            <div className={isPreviewMode ? 'mr-9' : ''}>Diff Mode</div>
            {showSuperConversionInfo && (
              <StyledTooltip
                interactive
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
                showOnHover={false}
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
