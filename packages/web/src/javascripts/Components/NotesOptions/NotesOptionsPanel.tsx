import Icon from '@/Components/Icon/Icon'
import VisuallyHidden from '@reach/visually-hidden'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import NotesOptions from './NotesOptions'
import { WebApplication } from '@/Application/Application'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { NotesController } from '@/Controllers/NotesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'

type Props = {
  application: WebApplication
  navigationController: NavigationController
  notesController: NotesController
  noteTagsController: NoteTagsController
  historyModalController: HistoryModalController
  onClickPreprocessing?: () => Promise<void>
}

const NotesOptionsPanel = ({
  application,
  navigationController,
  notesController,
  noteTagsController,
  historyModalController,
  onClickPreprocessing,
}: Props) => {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({
    top: 0,
    right: 0,
  })
  const [maxHeight, setMaxHeight] = useState<number | 'auto'>('auto')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [closeOnBlur] = useCloseOnBlur(panelRef, setOpen)

  return (
    <Disclosure
      open={open}
      onChange={async () => {
        const rect = buttonRef.current?.getBoundingClientRect()
        if (rect) {
          const { clientHeight } = document.documentElement
          const footerElementRect = document.getElementById('footer-bar')?.getBoundingClientRect()
          const footerHeightInPx = footerElementRect?.height
          if (footerHeightInPx) {
            setMaxHeight(clientHeight - rect.bottom - footerHeightInPx - 2)
          }
          setPosition({
            top: rect.bottom,
            right: document.body.clientWidth - rect.right,
          })
          const newOpenState = !open
          if (newOpenState && onClickPreprocessing) {
            await onClickPreprocessing()
          }
          setOpen(newOpenState)
        }
      }}
    >
      <DisclosureButton
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
        onBlur={closeOnBlur}
        ref={buttonRef}
        className="bg-text-padding flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast"
      >
        <VisuallyHidden>Actions</VisuallyHidden>
        <Icon type="more" className="block" />
      </DisclosureButton>
      <DisclosurePanel
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false)
            buttonRef.current?.focus()
          }
        }}
        ref={panelRef}
        style={{
          ...position,
          maxHeight,
        }}
        className={`${
          open ? 'flex' : 'hidden'
        } max-h-120 slide-down-animation fixed min-w-80 max-w-xs flex-col overflow-y-auto rounded bg-default pt-2 shadow-main transition-transform duration-150`}
        onBlur={closeOnBlur}
        tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      >
        {open && (
          <NotesOptions
            application={application}
            navigationController={navigationController}
            notesController={notesController}
            noteTagsController={noteTagsController}
            historyModalController={historyModalController}
            closeOnBlur={closeOnBlur}
          />
        )}
      </DisclosurePanel>
    </Disclosure>
  )
}

export default observer(NotesOptionsPanel)
