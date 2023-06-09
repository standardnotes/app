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
import { StringUtils, Strings } from '@/Constants/Strings'
import { confirmDialog } from '@standardnotes/ui-services'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'
import { NoteAttributes } from '../NotesOptions/NoteAttributes'
import CheckIndicator from '../Checkbox/CheckIndicator'

const ConflictListItem = ({
  isSelected,
  onClick,
  title,
  note,
}: {
  isSelected: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
  title: string
  note: SNNote
}) => {
  const application = useApplication()

  return (
    <button
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      className={classNames(
        'flex w-full cursor-pointer flex-col border-l-2 bg-transparent px-3 py-2.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none',
        isSelected ? 'border-info bg-info-backdrop' : 'border-transparent',
      )}
      onClick={onClick}
      data-selected={isSelected}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <CheckIndicator checked={isSelected} />
        <div className="font-semibold">{title}</div>
      </div>
      <NoteAttributes application={application} note={note} className="!p-0" hideReadTime />
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
    async (note: SNNote, silent = false) => {
      const confirmDialogTitle = Strings.trashItemsTitle
      const confirmDialogText = StringUtils.deleteNotes(false, 1, `'${note.title}'`)

      if (
        silent ||
        (await confirmDialog({
          title: confirmDialogTitle,
          text: confirmDialogText,
          confirmButtonStyle: 'danger',
        }))
      ) {
        await application.mutator
          .changeItem(note, (mutator) => {
            mutator.trashed = true
            mutator.conflictOf = undefined
          })
          .catch(console.error)
        setSelectedVersions([allVersions[0].uuid])
      }
    },
    [allVersions, application.mutator],
  )

  const trashSelectedNote = useCallback(async () => {
    if (selectedNotes.length !== 1) {
      return
    }

    trashNote(selectedNotes[0]).catch(console.error)
  }, [selectedNotes, trashNote])

  const keepOnlySelectedNote = useCallback(async () => {
    if (selectedNotes.length !== 1) {
      return
    }

    if (
      await confirmDialog({
        title: 'Keep only selected version?',
        text: 'This will keep only the selected version and move all other versions to the trash. Are you sure?',
        confirmButtonStyle: 'danger',
      })
    ) {
      const notesToTrash = allVersions.filter((note) => note.uuid !== selectedNotes[0].uuid)
      await Promise.all(notesToTrash.map((note) => trashNote(note, true)))
      await application.mutator.changeItem(selectedNotes[0], (mutator) => {
        mutator.conflictOf = undefined
      })
      void application.getViewControllerManager().selectionController.selectItem(selectedNotes[0].uuid, true)
      void application.sync.sync()
      close()
    }
  }, [allVersions, application, close, selectedNotes, trashNote])

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)
  const actions = useMemo(
    (): ModalAction[] => [
      {
        label: 'Cancel',
        onClick: close,
        type: 'cancel',
        mobileSlot: 'left',
      },
      {
        label: 'Move selected to trash',
        onClick: trashSelectedNote,
        type: 'destructive',
        mobileSlot: 'left',
        hidden: selectedNotes.length !== 1,
      },
      {
        label: isMobileScreen ? 'Keep' : 'Keep only selected',
        onClick: keepOnlySelectedNote,
        type: 'primary',
        mobileSlot: 'right',
        hidden: selectedNotes.length !== 1,
      },
    ],
    [close, isMobileScreen, keepOnlySelectedNote, selectedNotes.length, trashSelectedNote],
  )

  const listRef = useRef<HTMLDivElement>(null)
  useListKeyboardNavigation(listRef)

  const [selectedMobileTab, setSelectedMobileTab] = useState<'list' | 'content'>('list')

  return (
    <Modal
      title="Resolve conflicts"
      className={{
        content: 'md:h-full md:w-[70vw]',
        description: 'flex flex-col md:flex-row',
      }}
      actions={actions}
      close={close}
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
            isSelected={selectedVersions.includes(note.uuid)}
            onClick={(event) => {
              if (event.ctrlKey || event.metaKey) {
                setSelectedVersions((versions) => {
                  if (!versions.includes(note.uuid)) {
                    return versions.slice(1).concat(note.uuid)
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
          'w-full flex-grow divide-x divide-border',
          isMobileScreen ? (selectedMobileTab === 'content' ? 'flex' : 'hidden md:flex') : 'grid grid-rows-1',
        )}
        style={!isMobileScreen ? { gridTemplateColumns: `repeat(${selectedNotes.length}, 1fr)` } : undefined}
      >
        {selectedNotes.map((note) => (
          <NoteContent note={note} />
        ))}
      </div>
    </Modal>
  )
}

export default NoteConflictResolutionModal
