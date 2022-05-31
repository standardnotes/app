import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { MENU_MARGIN_FROM_APP_BORDER } from '@/Constants'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import VisuallyHidden from '@reach/visually-hidden'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import AttachedFilesPopover from './AttachedFilesPopover'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { PopoverFileItemAction } from './PopoverFileItemAction'

type Props = {
  application: WebApplication
  appState: AppState
  onClickPreprocessing?: () => Promise<void>
}

const AttachedFilesButton: FunctionComponent<Props> = ({ application, appState, onClickPreprocessing }: Props) => {
  const premiumModal = usePremiumModal()
  const { currentTab, setCurrentTab, allFiles, attachedFiles } = appState.files
  const attachedFilesCount = attachedFiles.length
  const { isDraggingFiles } = appState.filesDragManager

  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({
    top: 0,
    right: 0,
  })
  const [maxHeight, setMaxHeight] = useState<number | 'auto'>('auto')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [closeOnBlur, keepMenuOpen] = useCloseOnBlur(containerRef, setOpen)

  useEffect(() => {
    if (appState.filePreviewModal.isOpen) {
      keepMenuOpen(true)
    } else {
      keepMenuOpen(false)
    }
  }, [appState.filePreviewModal.isOpen, keepMenuOpen])

  const toggleAttachedFilesMenu = useCallback(async () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      const { clientHeight } = document.documentElement
      const footerElementRect = document.getElementById('footer-bar')?.getBoundingClientRect()
      const footerHeightInPx = footerElementRect?.height

      if (footerHeightInPx) {
        setMaxHeight(clientHeight - rect.bottom - footerHeightInPx - MENU_MARGIN_FROM_APP_BORDER)
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
  }, [onClickPreprocessing, open])

  const prospectivelyShowFilesPremiumModal = useCallback(() => {
    if (!appState.features.hasFiles) {
      premiumModal.activate('Files')
    }
  }, [appState.features.hasFiles, premiumModal])

  const toggleAttachedFilesMenuWithEntitlementCheck = useCallback(async () => {
    prospectivelyShowFilesPremiumModal()

    await toggleAttachedFilesMenu()
  }, [toggleAttachedFilesMenu, prospectivelyShowFilesPremiumModal])

  useEffect(() => {
    if (isDraggingFiles && !open) {
      void toggleAttachedFilesMenuWithEntitlementCheck()
    }
  }, [isDraggingFiles, open, toggleAttachedFilesMenuWithEntitlementCheck])

  const handleFileAction = useCallback(
    async (action: PopoverFileItemAction) => {
      const { didHandleAction } = await appState.files.handleFileAction(action, currentTab)
      return didHandleAction
    },
    [appState.files, currentTab],
  )

  return (
    <div ref={containerRef}>
      <Disclosure open={open} onChange={toggleAttachedFilesMenuWithEntitlementCheck}>
        <DisclosureButton
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false)
            }
          }}
          ref={buttonRef}
          className={`sn-icon-button border-contrast ${attachedFilesCount > 0 ? 'py-1 px-3' : ''}`}
          onBlur={closeOnBlur}
        >
          <VisuallyHidden>Attached files</VisuallyHidden>
          <Icon type="attachment-file" className="block" />
          {attachedFilesCount > 0 && <span className="ml-2">{attachedFilesCount}</span>}
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
          className="sn-dropdown sn-dropdown--animated min-w-80 max-h-120 max-w-xs flex flex-col overflow-y-auto fixed"
          onBlur={closeOnBlur}
        >
          {open && (
            <AttachedFilesPopover
              application={application}
              appState={appState}
              attachedFiles={attachedFiles}
              allFiles={allFiles}
              closeOnBlur={closeOnBlur}
              currentTab={currentTab}
              handleFileAction={handleFileAction}
              setCurrentTab={setCurrentTab}
            />
          )}
        </DisclosurePanel>
      </Disclosure>
    </div>
  )
}

export default observer(AttachedFilesButton)
