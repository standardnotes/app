import Icon from '@/Components/Icon/Icon'
import VisuallyHidden from '@reach/visually-hidden'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { useCallback, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import FileMenuOptions from './FileMenuOptions'
import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'

type Props = {
  filesController: FilesController
  selectionController: SelectedItemsController
}

const FilesOptionsPanel = ({ filesController, selectionController }: Props) => {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({
    top: 0,
    right: 0,
  })
  const [maxHeight, setMaxHeight] = useState<number | 'auto'>('auto')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [closeOnBlur] = useCloseOnBlur(panelRef, setOpen)

  const onDisclosureChange = useCallback(async () => {
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
  }, [])

  return (
    <Disclosure open={open} onChange={onDisclosureChange}>
      <DisclosureButton
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
        onBlur={closeOnBlur}
        ref={buttonRef}
        className="flex justify-center items-center min-w-8 h-8 bg-text-padding hover:bg-contrast focus:bg-contrast text-neutral border border-solid border-border rounded-full cursor-pointer"
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
        } flex-col min-w-80 max-h-120 max-w-xs py-2 fixed bg-default rounded-md shadow-sm transition-transform duration-150 slide-down-animation overflow-y-auto`}
        onBlur={closeOnBlur}
        tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      >
        {open && (
          <FileMenuOptions
            filesController={filesController}
            selectionController={selectionController}
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
