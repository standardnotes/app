import { observer } from 'mobx-react-lite'
import { useCallback, useRef, useMemo } from 'react'
import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import { MenuItemType } from '@/Components/Menu/MenuItemType'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { SNTag, VectorIconNameOrEmoji, DefaultTagIconName } from '@standardnotes/snjs'
import { useCloseOnClickOutside } from '@/Hooks/useCloseOnClickOutside'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'
import Popover from '../Popover/Popover'
import IconPicker from '../Icon/IconPicker'

type ContextMenuProps = {
  navigationController: NavigationController
  isEntitledToFolders: boolean
  selectedTag: SNTag
}

const TagContextMenu = ({ navigationController, isEntitledToFolders, selectedTag }: ContextMenuProps) => {
  const premiumModal = usePremiumModal()

  const { contextMenuOpen, contextMenuClickLocation, application } = navigationController

  const contextMenuRef = useRef<HTMLDivElement>(null)
  useCloseOnClickOutside(contextMenuRef, () => navigationController.setContextMenuOpen(false))

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
    navigationController.setEditingTag(selectedTag)
  }, [navigationController, selectedTag])

  const onClickDelete = useCallback(() => {
    navigationController.remove(selectedTag, true).catch(console.error)
  }, [navigationController, selectedTag])

  const tagLastModified = useMemo(
    () => formatDateForContextMenu(selectedTag.userModifiedDate),
    [selectedTag.userModifiedDate],
  )

  const handleIconChange = (value?: VectorIconNameOrEmoji) => {
    navigationController.setIcon(selectedTag, value || DefaultTagIconName)
  }

  const onClickStar = useCallback(() => {
    navigationController.setFavorite(selectedTag, !selectedTag.starred).catch(console.error)
    navigationController.setContextMenuOpen(false)
  }, [navigationController, selectedTag])

  const tagCreatedAt = useMemo(() => formatDateForContextMenu(selectedTag.created_at), [selectedTag.created_at])

  return (
    <Popover
      open={contextMenuOpen}
      anchorPoint={contextMenuClickLocation}
      togglePopover={() => navigationController.setContextMenuOpen(!contextMenuOpen)}
      className="py-2"
    >
      <div ref={contextMenuRef}>
        <Menu a11yLabel="Tag context menu" isOpen={contextMenuOpen}>
          <IconPicker
            key={'icon-picker'}
            onIconChange={handleIconChange}
            selectedValue={selectedTag.iconString}
            platform={application.platform}
            className={'px-3 py-1.5'}
            useIconGrid={true}
            iconGridClassName="max-h-30"
          />
          <HorizontalSeparator classes="my-2" />
          <MenuItem type={MenuItemType.IconButton} className={'justify-between py-1.5'} onClick={onClickStar}>
            <div className="flex items-center">
              <Icon type="star" className="mr-2 text-neutral" />
              {selectedTag.starred ? 'Unfavorite' : 'Favorite'}
            </div>
          </MenuItem>
          <MenuItem type={MenuItemType.IconButton} className={'justify-between py-1.5'} onClick={onClickAddSubtag}>
            <div className="flex items-center">
              <Icon type="add" className="mr-2 text-neutral" />
              Add subtag
            </div>
            {!isEntitledToFolders && <Icon type={PremiumFeatureIconName} className={PremiumFeatureIconClass} />}
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
        <div className="px-3 pt-1 pb-1.5 text-sm font-medium text-neutral lg:text-xs">
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
    </Popover>
  )
}

export default observer(TagContextMenu)
