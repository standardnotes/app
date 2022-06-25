import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useRef } from 'react'
import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import { MenuItemType } from '@/Components/Menu/MenuItemType'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { SNTag } from '@standardnotes/snjs'
import { isControllerDealloced } from '@/Controllers/Abstract/IsControllerDealloced'

type WrapperProps = {
  viewControllerManager: ViewControllerManager
}

type ContextMenuProps = WrapperProps & {
  selectedTag: SNTag
}

const TagsContextMenu = observer(({ viewControllerManager, selectedTag }: ContextMenuProps) => {
  const premiumModal = usePremiumModal()

  const { contextMenuOpen, contextMenuPosition, contextMenuMaxHeight } = viewControllerManager.navigationController

  const contextMenuRef = useRef<HTMLDivElement>(null)
  const [closeOnBlur] = useCloseOnBlur(contextMenuRef, (open: boolean) =>
    viewControllerManager.navigationController.setContextMenuOpen(open),
  )

  const reloadContextMenuLayout = useCallback(() => {
    viewControllerManager.navigationController.reloadContextMenuLayout()
  }, [viewControllerManager])

  useEffect(() => {
    window.addEventListener('resize', reloadContextMenuLayout)
    return () => {
      window.removeEventListener('resize', reloadContextMenuLayout)
    }
  }, [reloadContextMenuLayout])

  const onClickAddSubtag = useCallback(() => {
    if (!viewControllerManager.featuresController.hasFolders) {
      premiumModal.activate('Folders')
      return
    }

    viewControllerManager.navigationController.setContextMenuOpen(false)
    viewControllerManager.navigationController.setAddingSubtagTo(selectedTag)
  }, [viewControllerManager, selectedTag, premiumModal])

  const onClickRename = useCallback(() => {
    viewControllerManager.navigationController.setContextMenuOpen(false)
    viewControllerManager.navigationController.editingTag = selectedTag
  }, [viewControllerManager, selectedTag])

  const onClickDelete = useCallback(() => {
    viewControllerManager.navigationController.remove(selectedTag, true).catch(console.error)
  }, [viewControllerManager, selectedTag])

  return contextMenuOpen ? (
    <div
      ref={contextMenuRef}
      className="bg-default rounded-md shadow-md min-w-60 max-h-120 max-w-xs flex flex-col py-2 overflow-y-auto fixed"
      style={{
        ...contextMenuPosition,
        maxHeight: contextMenuMaxHeight,
      }}
    >
      <Menu
        a11yLabel="Tag context menu"
        isOpen={contextMenuOpen}
        closeMenu={() => {
          viewControllerManager.navigationController.setContextMenuOpen(false)
        }}
      >
        <MenuItem
          type={MenuItemType.IconButton}
          onBlur={closeOnBlur}
          className={'py-1.5 justify-between'}
          onClick={onClickAddSubtag}
        >
          <div className="flex items-center">
            <Icon type="add" className="text-neutral mr-2" />
            Add subtag
          </div>
          {!viewControllerManager.featuresController.hasFolders && <Icon type="premium-feature" />}
        </MenuItem>
        <MenuItem type={MenuItemType.IconButton} onBlur={closeOnBlur} className={'py-1.5'} onClick={onClickRename}>
          <Icon type="pencil-filled" className="text-neutral mr-2" />
          Rename
        </MenuItem>
        <MenuItem type={MenuItemType.IconButton} onBlur={closeOnBlur} className={'py-1.5'} onClick={onClickDelete}>
          <Icon type="trash" className="mr-2 text-danger" />
          <span className="text-danger">Delete</span>
        </MenuItem>
      </Menu>
    </div>
  ) : null
})

TagsContextMenu.displayName = 'TagsContextMenu'

const TagsContextMenuWrapper = ({ viewControllerManager }: WrapperProps) => {
  if (isControllerDealloced(viewControllerManager)) {
    return null
  }

  const selectedTag = viewControllerManager.navigationController.selected

  if (!selectedTag || !(selectedTag instanceof SNTag)) {
    return null
  }

  return <TagsContextMenu viewControllerManager={viewControllerManager} selectedTag={selectedTag} />
}

export default observer(TagsContextMenuWrapper)
