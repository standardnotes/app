import { ContentType, NoteType, SNNote, classNames } from '@standardnotes/snjs'
import Modal, { ModalAction } from '../Modal/Modal'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import RadioIndicator from '../Radio/RadioIndicator'
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

const ConflictListItem = ({
  isSelected,
  onClick,
  title,
  note,
}: {
  isSelected: boolean
  onClick: () => void
  title: string
  note: SNNote
}) => {
  const application = useApplication()

  return (
    <button
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      className={classNames(
        'flex w-full cursor-pointer flex-col border-0 bg-transparent px-3 py-2.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none',
        isSelected ? 'border-l-2 border-info bg-info-backdrop' : '',
      )}
      onClick={onClick}
      data-selected={isSelected}
    >
      <div className="mb-1.5 flex items-center">
        <RadioIndicator checked={isSelected} className="mr-2" />
        <div className="font-semibold">{title}</div>
      </div>
      <NoteAttributes application={application} note={note} className="!p-0" hideReadTime />
    </button>
  )
}

const NoteContent = ({ note }: { note: SNNote }) => {
  const application = useApplication()
  const linkingController = useLinkingController()

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
    <div className="flex h-full flex-col overflow-hidden">
      <div className="w-full px-4 pt-4 text-base font-bold">
        <div className="title">{note.title}</div>
      </div>
      <LinkedItemBubblesContainer
        item={note}
        linkingController={linkingController}
        readonly
        className={{ base: 'mt-2 px-4', withToggle: '!mt-1 !pt-0' }}
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
  const [selectedVersion, setSelectedVersion] = useState(currentNote.uuid)

  const selectedNote = useMemo(() => {
    return allVersions.find((note) => note.uuid === selectedVersion)
  }, [allVersions, selectedVersion])

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
        setSelectedVersion(currentNote.uuid)
      }
    },
    [application.mutator, currentNote.uuid],
  )

  const trashSelectedNote = useCallback(async () => {
    if (!selectedNote) {
      return
    }

    trashNote(selectedNote).catch(console.error)
  }, [selectedNote, trashNote])

  const keepOnlySelectedNote = useCallback(async () => {
    if (!selectedNote) {
      return
    }

    if (
      await confirmDialog({
        title: 'Keep only selected version?',
        text: 'This will keep only the selected version and move all other versions to the trash. Are you sure?',
        confirmButtonStyle: 'danger',
      })
    ) {
      const notesToTrash = allVersions.filter((note) => note.uuid !== selectedNote.uuid)
      await Promise.all(notesToTrash.map((note) => trashNote(note, true)))
      close()
    }
  }, [allVersions, close, selectedNote, trashNote])

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
      },
      {
        label: isMobileScreen ? 'Keep' : 'Keep only selected',
        onClick: keepOnlySelectedNote,
        type: 'primary',
        mobileSlot: 'right',
      },
    ],
    [close, isMobileScreen, keepOnlySelectedNote, trashSelectedNote],
  )

  const listRef = useRef<HTMLDivElement>(null)
  useListKeyboardNavigation(listRef)

  return (
    <Modal
      title="Resolve conflicts"
      className={{
        content: 'md:h-full md:w-[70vw]',
        description: 'flex',
      }}
      actions={actions}
      close={close}
    >
      <div
        className="w-full overflow-y-auto border-r border-border py-1.5 md:flex md:w-auto md:min-w-60 md:flex-col"
        ref={listRef}
      >
        {allVersions.map((note, index) => (
          <ConflictListItem
            isSelected={selectedVersion === note.uuid}
            onClick={() => setSelectedVersion(note.uuid)}
            key={note.uuid}
            title={index === 0 ? 'Current version' : `Version ${index + 1}`}
            note={note}
          />
        ))}
      </div>
      <div className="flex-grow">{selectedNote && <NoteContent note={selectedNote} />}</div>
    </Modal>
  )
}

export default NoteConflictResolutionModal
