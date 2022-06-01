import Icon from '@/Components/Icon/Icon'
import VisuallyHidden from '@reach/visually-hidden'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import FileMenuOptions from './FileMenuOptions'
import { FilesController } from '@/Controllers/FilesController'

type Props = {
  filesController: FilesController
}

const FilesOptionsPanel = ({ filesController }: Props) => {
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
          setOpen((open) => !open)
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
        className="sn-icon-button border-contrast"
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
        className="sn-dropdown sn-dropdown--animated min-w-80 max-h-120 max-w-xs flex flex-col py-2 overflow-y-auto fixed"
        onBlur={closeOnBlur}
        tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      >
        {open && (
          <FileMenuOptions
            filesController={filesController}
            closeOnBlur={closeOnBlur}
            closeMenu={() => {
              setOpen(false)
            }}
            shouldShowAttachOption={false}
            shouldShowRenameOption={false}
          />
        )}
      </DisclosurePanel>
    </Disclosure>
  )
}

export default observer(FilesOptionsPanel)
