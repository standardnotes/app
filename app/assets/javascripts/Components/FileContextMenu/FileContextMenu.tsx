import { MAX_MENU_SIZE_MULTIPLIER, MENU_MARGIN_FROM_APP_BORDER } from '@/Constants/Constants'
import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { useCloseOnClickOutside } from '@/Hooks/useCloseOnClickOutside'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import FileMenuOptions from './FileMenuOptions'

type Props = {
  filesController: FilesController
  selectionController: SelectedItemsController
}

const FileContextMenu: FunctionComponent<Props> = observer(({ filesController, selectionController }) => {
  const { showFileContextMenu, setShowFileContextMenu, fileContextMenuLocation } = filesController

  const [contextMenuStyle, setContextMenuStyle] = useState<React.CSSProperties>({
    top: 0,
    left: 0,
    visibility: 'hidden',
  })
  const [contextMenuMaxHeight, setContextMenuMaxHeight] = useState<number | 'auto'>('auto')
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const [closeOnBlur] = useCloseOnBlur(contextMenuRef, (open: boolean) => setShowFileContextMenu(open))
  useCloseOnClickOutside(contextMenuRef, () => filesController.setShowFileContextMenu(false))

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
        filesController={filesController}
        selectionController={selectionController}
        closeOnBlur={closeOnBlur}
        closeMenu={() => setShowFileContextMenu(false)}
        shouldShowRenameOption={false}
        shouldShowAttachOption={false}
      />
    </div>
  )
})

FileContextMenu.displayName = 'FileContextMenu'

const FileContextMenuWrapper: FunctionComponent<Props> = ({ filesController, selectionController }) => {
  const { showFileContextMenu } = filesController
  const { selectedFiles } = selectionController

  const selectedFile = selectedFiles[0]

  if (!showFileContextMenu || !selectedFile) {
    return null
  }

  return <FileContextMenu filesController={filesController} selectionController={selectionController} />
}

export default observer(FileContextMenuWrapper)
