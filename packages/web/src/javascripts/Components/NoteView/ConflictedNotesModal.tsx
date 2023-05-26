import { SNNote, classNames } from '@standardnotes/snjs'
import Modal, { ModalAction } from '../Modal/Modal'
import { ReactNode, useMemo, useState } from 'react'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import RadioIndicator from '../Radio/RadioIndicator'

const ListItem = ({
  children,
  isSelected,
  onClick,
}: {
  isSelected: boolean
  onClick: () => void
  children?: ReactNode
}) => {
  return (
    <button
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      className={classNames(
        'flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-2.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none',
        isSelected ? 'bg-info-backdrop' : '',
      )}
      onClick={onClick}
      data-selected={isSelected}
    >
      <RadioIndicator checked={isSelected} className="mr-2" />
      {children}
    </button>
  )
}

type Props = {
  currentNote: SNNote
  conflictedNotes: Set<SNNote>
  close: () => void
}

const ConflictedNotesModal = ({ currentNote, conflictedNotes, close }: Props) => {
  const [selectedVersion, setSelectedVersion] = useState(currentNote.uuid)

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
        label: isMobileScreen ? 'Choose' : 'Choose version',
        onClick: close,
        type: 'primary',
        mobileSlot: 'right',
      },
    ],
    [close, isMobileScreen],
  )

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
      <div className="w-full border-r border-border py-1.5 md:flex md:w-auto md:min-w-60 md:flex-col">
        <ListItem
          isSelected={selectedVersion === currentNote.uuid}
          onClick={() => setSelectedVersion(currentNote.uuid)}
        >
          Current version
        </ListItem>
        {[...conflictedNotes].map((note, index) => (
          <ListItem
            isSelected={selectedVersion === note.uuid}
            onClick={() => setSelectedVersion(note.uuid)}
            key={note.uuid}
          >
            Version {index + 1}
          </ListItem>
        ))}
      </div>
      <div className="flex-grow">.</div>
    </Modal>
  )
}

export default ConflictedNotesModal
