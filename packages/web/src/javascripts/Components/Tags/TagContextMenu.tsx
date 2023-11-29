import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { SNTag, VectorIconNameOrEmoji, DefaultTagIconName } from '@standardnotes/snjs'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'
import Popover from '../Popover/Popover'
import IconPicker from '../Icon/IconPicker'
import AddToVaultMenuOption from '../Vaults/AddToVaultMenuOption'
import { useApplication } from '../ApplicationProvider'
import MenuSection from '../Menu/MenuSection'
import DecoratedInput from '../Input/DecoratedInput'
import { KeyboardKey } from '@standardnotes/ui-services'

type ContextMenuProps = {
  navigationController: NavigationController
  isEntitledToFolders: boolean
  selectedTag: SNTag
}

const TagContextMenu = ({ navigationController, isEntitledToFolders, selectedTag }: ContextMenuProps) => {
  const application = useApplication()

  const premiumModal = usePremiumModal()

  const { contextMenuOpen, contextMenuClickLocation } = navigationController

  const onClickAddSubtag = useCallback(() => {
    if (!isEntitledToFolders) {
      premiumModal.activate('Folders')
      return
    }

    navigationController.setContextMenuOpen(false)
    navigationController.setAddingSubtagTo(selectedTag)
  }, [isEntitledToFolders, navigationController, selectedTag, premiumModal])

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

  const titleInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (contextMenuOpen) {
      setTimeout(() => {
        titleInputRef.current?.focus()
      })
    }
  }, [contextMenuOpen])

  const saveTitle = useCallback(
    (closeMenu = false) => {
      if (!titleInputRef.current) {
        return
      }
      const value = titleInputRef.current.value.trim()
      navigationController
        .save(selectedTag, value)
        .catch(console.error)
        .finally(() => {
          if (closeMenu) {
            navigationController.setContextMenuOpen(false)
          }
        })
    },
    [navigationController, selectedTag],
  )

  return (
    <Popover
      title="Tag options"
      open={contextMenuOpen}
      anchorPoint={contextMenuClickLocation}
      togglePopover={() => navigationController.setContextMenuOpen(!contextMenuOpen)}
      className="py-2"
    >
      <div className="flex flex-col gap-1 px-4 py-0.5 text-mobile-menu-item md:px-3 md:text-tablet-menu-item lg:text-menu-item">
        <div className="font-semibold">Name</div>
        <div className="flex gap-2.5">
          <DecoratedInput
            ref={titleInputRef}
            className={{
              container: 'flex-grow',
              input: 'text-mobile-menu-item md:text-tablet-menu-item lg:text-menu-item',
            }}
            defaultValue={selectedTag.title}
            key={selectedTag.uuid}
            onBlur={() => saveTitle()}
            onKeyDown={(event) => {
              if (event.key === KeyboardKey.Enter) {
                saveTitle(true)
              }
            }}
          />
          <button
            aria-label="Save tag name"
            className="rounded border border-border bg-transparent px-1.5 active:bg-default translucent-ui:border-[--popover-border-color] md:hidden"
            onClick={() => saveTitle(true)}
          >
            <Icon type="check" />
          </button>
        </div>
      </div>
      <HorizontalSeparator classes="my-2" />
      <Menu a11yLabel="Tag context menu">
        <IconPicker
          key={selectedTag.uuid}
          onIconChange={handleIconChange}
          selectedValue={selectedTag.iconString}
          platform={application.platform}
          className={'py-1.5 md:px-3'}
          useIconGrid={true}
          iconGridClassName="max-h-30"
          autoFocus={false}
        />
        <MenuSection>
          {application.featuresController.isVaultsEnabled() && (
            <AddToVaultMenuOption iconClassName="mr-2 text-neutral" items={[selectedTag]} />
          )}
          <MenuItem className={'justify-between py-1.5'} onClick={onClickStar}>
            <div className="flex items-center">
              <Icon type="star" className="mr-2 text-neutral" />
              {selectedTag.starred ? 'Unfavorite' : 'Favorite'}
            </div>
          </MenuItem>
          <MenuItem className={'justify-between py-1.5'} onClick={onClickAddSubtag}>
            <div className="flex items-center">
              <Icon type="add" className="mr-2 text-neutral" />
              Add subtag
            </div>
            {!isEntitledToFolders && <Icon type={PremiumFeatureIconName} className={PremiumFeatureIconClass} />}
          </MenuItem>
          <MenuItem className={'py-1.5'} onClick={onClickDelete}>
            <Icon type="trash" className="mr-2 text-danger" />
            <span className="text-danger">Delete</span>
          </MenuItem>
        </MenuSection>
      </Menu>
      <HorizontalSeparator classes="my-2" />
      <div className="px-4 pb-1.5 pt-1 text-sm font-medium text-neutral md:px-3 lg:text-xs">
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
    </Popover>
  )
}

export default observer(TagContextMenu)
