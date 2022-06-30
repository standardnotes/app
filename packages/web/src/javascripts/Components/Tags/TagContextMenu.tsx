import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useRef, useMemo } from 'react'
import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import { MenuItemType } from '@/Components/Menu/MenuItemType'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { SNTag } from '@standardnotes/snjs'
import { useCloseOnClickOutside } from '@/Hooks/useCloseOnClickOutside'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { formatDateForContextMenu } from '@/Utils/DateUtils'

type ContextMenuProps = {
  navigationController: NavigationController
  isEntitledToFolders: boolean
  selectedTag: SNTag
}

const TagContextMenu = ({ navigationController, isEntitledToFolders, selectedTag }: ContextMenuProps) => {
  const premiumModal = usePremiumModal()

  const { contextMenuOpen, contextMenuPosition, contextMenuMaxHeight } = navigationController

  const contextMenuRef = useRef<HTMLDivElement>(null)
  useCloseOnClickOutside(contextMenuRef, () => navigationController.setContextMenuOpen(false))

  const reloadContextMenuLayout = useCallback(() => {
    navigationController.reloadContextMenuLayout()
  }, [navigationController])

  useEffect(() => {
    window.addEventListener('resize', reloadContextMenuLayout)
    return () => {
      window.removeEventListener('resize', reloadContextMenuLayout)
    }
  }, [reloadContextMenuLayout])

  const onClickAddSubtag = useCallback(() => {
    if (!isEntitledToFolders) {
      premiumModal.activate('Folders')
      return
    }

    navigationController.setContextMenuOpen(false)
    navigationController.setAddingSubtagTo(selectedTag)
  }, [isEntitledToFolders, navigationController, selectedTag, premiumModal])

  const onClickRename = useCallback(() => {
    navigationController.setContextMenuOpen(false)
    navigationController.editingTag = selectedTag
  }, [navigationController, selectedTag])

  const onClickDelete = useCallback(() => {
    navigationController.remove(selectedTag, true).catch(console.error)
  }, [navigationController, selectedTag])

  const tagLastModified = useMemo(
    () => formatDateForContextMenu(selectedTag.userModifiedDate),
    [selectedTag.userModifiedDate],
  )

  const tagCreatedAt = useMemo(() => formatDateForContextMenu(selectedTag.created_at), [selectedTag.created_at])

  return contextMenuOpen ? (
    <div
      ref={contextMenuRef}
      className="max-h-120 fixed z-dropdown-menu flex min-w-60 flex-col overflow-y-auto rounded bg-default py-2 shadow-main"
      style={{
        ...contextMenuPosition,
        maxHeight: contextMenuMaxHeight,
      }}
    >
      <Menu
        a11yLabel="Tag context menu"
        isOpen={contextMenuOpen}
        closeMenu={() => {
          navigationController.setContextMenuOpen(false)
        }}
      >
        <MenuItem type={MenuItemType.IconButton} className={'justify-between py-1.5'} onClick={onClickAddSubtag}>
          <div className="flex items-center">
            <Icon type="add" className="mr-2 text-neutral" />
            Add subtag
          </div>
          {!isEntitledToFolders && <Icon type="premium-feature" />}
        </MenuItem>
        <MenuItem type={MenuItemType.IconButton} className={'py-1.5'} onClick={onClickRename}>
          <Icon type="pencil-filled" className="mr-2 text-neutral" />
          Rename
        </MenuItem>
        <MenuItem type={MenuItemType.IconButton} className={'py-1.5'} onClick={onClickDelete}>
          <Icon type="trash" className="mr-2 text-danger" />
          <span className="text-danger">Delete</span>
        </MenuItem>
      </Menu>
      <HorizontalSeparator classes="my-2" />
      <div className="px-3 pt-1 pb-1.5 text-xs font-medium text-neutral">
        <div className="mb-1">
          <span className="font-semibold">Last modified:</span> {tagLastModified}
        </div>
        <div className="mb-1">
          <span className="font-semibold">Created:</span> {tagCreatedAt}
        </div>
        <div>
          <span className="font-semibold">Tag ID:</span> {selectedTag.uuid}
        </div>
      </div>
    </div>
  ) : null
}

export default observer(TagContextMenu)
