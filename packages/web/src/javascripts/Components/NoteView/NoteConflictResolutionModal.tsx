import { ContentType, NoteType, SNNote, classNames } from '@standardnotes/snjs'
import Modal, { ModalAction } from '../Modal/Modal'
import { MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { useApplication } from '../ApplicationProvider'
import ComponentView from '../ComponentView/ComponentView'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import { BlocksEditor } from '../SuperEditor/BlocksEditor'
import { BlocksEditorComposer } from '../SuperEditor/BlocksEditorComposer'
import { useLinkingController } from '@/Controllers/LinkingControllerProvider'
import LinkedItemBubblesContainer from '../LinkedItems/LinkedItemBubblesContainer'
import { confirmDialog } from '@standardnotes/ui-services'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import { useNoteAttributes } from '../NotesOptions/NoteAttributes'
import CheckIndicator from '../Checkbox/CheckIndicator'
import ModalDialogButtons from '../Modal/ModalDialogButtons'
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
import Popover from '../Popover/Popover'
import Icon from '../Icon/Icon'
import Button from '../Button/Button'
import Spinner from '../Spinner/Spinner'

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
        'flex w-full flex-col border-l-2 bg-transparent px-3 py-2.5 text-left text-sm text-text',
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

const NoteContent = ({ note }: { note: SNNote }) => {
  const application = useApplication()
  const linkingController = useLinkingController()

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const componentViewer = useMemo(() => {
    const editorForCurrentNote = note ? application.componentManager.editorForNote(note) : undefined

    if (!editorForCurrentNote) {
      return undefined
    }

    const templateNoteForRevision = application.mutator.createTemplateItem(ContentType.Note, note.content) as SNNote

    const componentViewer = application.componentManager.createComponentViewer(editorForCurrentNote)
    componentViewer.setReadonly(true)
    componentViewer.lockReadonly = true
    componentViewer.overrideContextItem = templateNoteForRevision
    return componentViewer
  }, [application.componentManager, application.mutator, note])

  useEffect(() => {
    return () => {
      if (componentViewer) {
        application.componentManager.destroyComponentViewer(componentViewer)
      }
    }
  }, [application, componentViewer])

  return (
    <div className="flex h-full flex-grow flex-col overflow-hidden">
      <div className="w-full px-4 pt-4 text-base font-bold">
        <div className="title">{note.title}</div>
      </div>
      <LinkedItemBubblesContainer
        item={note}
        linkingController={linkingController}
        readonly
        className={{ base: 'mt-2 px-4', withToggle: '!mt-1 !pt-0' }}
        isCollapsedByDefault={isMobileScreen}
      />
      {componentViewer ? (
        <div className="component-view">
          <ComponentView key={componentViewer.identifier} componentViewer={componentViewer} application={application} />
        </div>
      ) : note?.noteType === NoteType.Super ? (
        <ErrorBoundary>
          <div className="w-full flex-grow overflow-hidden overflow-y-auto">
            <BlocksEditorComposer readonly initialValue={note.text}>
              <BlocksEditor
                readonly
                className="blocks-editor relative h-full resize-none p-4 text-base focus:shadow-none focus:outline-none"
                spellcheck={note.spellcheck}
              ></BlocksEditor>
            </BlocksEditorComposer>
          </div>
        </ErrorBoundary>
      ) : (
        <div className="relative mt-3 min-h-0 flex-grow overflow-hidden">
          {note.text.length ? (
            <textarea
              readOnly={true}
              className="font-editor h-full w-full resize-none border-0 bg-default p-4 pt-0 text-editor text-text"
              value={note.text}
            />
          ) : (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-passive-0">
              Empty note.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type ConflictAction = 'move-to-trash' | 'delete-permanently'

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

  return (
    <Modal
      title="Resolve conflicts"
      className={{
        content: 'md:h-full md:w-[70vw]',
        description: 'flex flex-col md:flex-row',
      }}
      actions={actions}
      close={close}
      customFooter={
        <ModalDialogButtons>
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
              if (event.ctrlKey || event.metaKey) {
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
          'w-full flex-grow divide-x divide-border pb-0.5',
          isMobileScreen ? (selectedMobileTab === 'content' ? 'flex' : 'hidden md:flex') : 'grid grid-rows-1',
        )}
        style={!isMobileScreen ? { gridTemplateColumns: `repeat(${selectedNotes.length}, 1fr)` } : undefined}
      >
        {selectedNotes.map((note) => (
          <NoteContent note={note} key={note.uuid} />
        ))}
      </div>
    </Modal>
  )
}

export default NoteConflictResolutionModal
