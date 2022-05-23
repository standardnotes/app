import { MAX_MENU_SIZE_MULTIPLIER, MENU_MARGIN_FROM_APP_BORDER } from '@/Constants'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { useCloseOnClickOutside } from '@/Hooks/useCloseOnClickOutside'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import React from 'react'
import { PopoverFileItemAction } from '../AttachedFilesPopover/PopoverFileItemAction'
import { PopoverTabs } from '../AttachedFilesPopover/PopoverTabs'
import { FileMenuOptions } from './FileMenuOptions'

type Props = {
  appState: AppState
}

export const FileContextMenu: FunctionComponent<Props> = observer(({ appState }) => {
  const { selectedFiles, showFileContextMenu, setShowFileContextMenu, fileContextMenuLocation } = appState.files

  const [contextMenuStyle, setContextMenuStyle] = useState<React.CSSProperties>({
    top: 0,
    left: 0,
    visibility: 'hidden',
  })
  const [contextMenuMaxHeight, setContextMenuMaxHeight] = useState<number | 'auto'>('auto')
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const [closeOnBlur] = useCloseOnBlur(contextMenuRef, (open: boolean) => setShowFileContextMenu(open))
  useCloseOnClickOutside(contextMenuRef, () => appState.files.setShowFileContextMenu(false))

  const selectedFile = selectedFiles[0]
  if (!showFileContextMenu || !selectedFile) {
    return null
  }

  const reloadContextMenuLayout = useCallback(() => {
    const { clientHeight } = document.documentElement
    const defaultFontSize = window.getComputedStyle(document.documentElement).fontSize
    const maxContextMenuHeight = parseFloat(defaultFontSize) * MAX_MENU_SIZE_MULTIPLIER
    const footerElementRect = document.getElementById('footer-bar')?.getBoundingClientRect()
    const footerHeightInPx = footerElementRect?.height

    let openUpBottom = true

    if (footerHeightInPx) {
      const bottomSpace = clientHeight - footerHeightInPx - fileContextMenuLocation.y
      const upSpace = fileContextMenuLocation.y

      if (maxContextMenuHeight > bottomSpace) {
        if (upSpace > maxContextMenuHeight) {
          openUpBottom = false
          setContextMenuMaxHeight('auto')
        } else {
          if (upSpace > bottomSpace) {
            setContextMenuMaxHeight(upSpace - MENU_MARGIN_FROM_APP_BORDER)
            openUpBottom = false
          } else {
            setContextMenuMaxHeight(bottomSpace - MENU_MARGIN_FROM_APP_BORDER)
          }
        }
      } else {
        setContextMenuMaxHeight('auto')
      }
    }

    if (openUpBottom) {
      setContextMenuStyle({
        top: fileContextMenuLocation.y,
        left: fileContextMenuLocation.x,
        visibility: 'visible',
      })
    } else {
      setContextMenuStyle({
        bottom: clientHeight - fileContextMenuLocation.y,
        left: fileContextMenuLocation.x,
        visibility: 'visible',
      })
    }
  }, [fileContextMenuLocation.x, fileContextMenuLocation.y])

  useEffect(() => {
    if (showFileContextMenu) {
      reloadContextMenuLayout()
    }
  }, [reloadContextMenuLayout, showFileContextMenu])

  useEffect(() => {
    window.addEventListener('resize', reloadContextMenuLayout)
    return () => {
      window.removeEventListener('resize', reloadContextMenuLayout)
    }
  }, [reloadContextMenuLayout])

  const handleFileAction = useCallback(
    async (action: PopoverFileItemAction) => {
      const { didHandleAction } = await appState.files.handleFileAction(action, PopoverTabs.AllFiles)
      return didHandleAction
    },
    [appState.files],
  )

  return (
    <div
      ref={contextMenuRef}
      className="sn-dropdown min-w-60 max-h-120 max-w-xs flex flex-col py-2 overflow-y-auto fixed"
      style={{
        ...contextMenuStyle,
        maxHeight: contextMenuMaxHeight,
      }}
    >
      <FileMenuOptions
        file={selectedFile}
        handleFileAction={handleFileAction}
        closeOnBlur={closeOnBlur}
        closeMenu={() => setShowFileContextMenu(false)}
        shouldShowRenameOption={false}
        shouldShowAttachOption={false}
      />
    </div>
  )
})
