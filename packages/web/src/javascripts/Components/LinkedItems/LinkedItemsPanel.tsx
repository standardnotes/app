import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import { observer } from 'mobx-react-lite'
import { useRef, useState } from 'react'
import ClearInputButton from '../ClearInputButton/ClearInputButton'
import Icon from '../Icon/Icon'
import DecoratedInput from '../Input/DecoratedInput'
import MenuItem from '../Menu/MenuItem'
import { MenuItemType } from '../Menu/MenuItemType'
import Popover from '../Popover/Popover'
import LinkedItemMeta from './LinkedItemMeta'
import LinkedItemSearchResults from './LinkedItemSearchResults'

const LinkedItemsSectionItem = ({
  item,
  getItemIcon,
  getTitleForLinkedTag,
  searchQuery,
  unlinkItem,
}: {
  item: LinkableItem
  getItemIcon: LinkingController['getLinkedItemIcon']
  getTitleForLinkedTag: LinkingController['getTitleForLinkedTag']
  searchQuery?: string
  unlinkItem: LinkingController['unlinkItemFromSelectedItem']
}) => {
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const toggleMenu = () => setIsMenuOpen((open) => !open)

  return (
    <div className="flex items-center justify-between gap-4 py-1 px-3">
      <LinkedItemMeta
        item={item}
        getItemIcon={getItemIcon}
        getTitleForLinkedTag={getTitleForLinkedTag}
        searchQuery={searchQuery}
      />
      <button
        className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-1 hover:bg-contrast"
        onClick={toggleMenu}
        ref={menuButtonRef}
      >
        <Icon type="more" className="text-neutral" />
      </button>
      <Popover
        open={isMenuOpen}
        togglePopover={toggleMenu}
        anchorElement={menuButtonRef.current}
        side="bottom"
        align="end"
      >
        <MenuItem
          type={MenuItemType.IconButton}
          onClick={() => {
            unlinkItem(item)
            toggleMenu()
          }}
        >
          <Icon type="link-off" className="mr-2 text-danger" />
          Unlink
        </MenuItem>
      </Popover>
    </div>
  )
}

const LinkedItemsSection = ({
  label,
  items,
  getItemIcon,
  getTitleForLinkedTag,
  searchQuery,
  unlinkItem,
}: {
  label: string
  items: LinkableItem[]
  getItemIcon: LinkingController['getLinkedItemIcon']
  getTitleForLinkedTag: LinkingController['getTitleForLinkedTag']
  searchQuery?: string
  unlinkItem: LinkingController['unlinkItemFromSelectedItem']
}) => {
  if (!items.length) {
    return null
  }

  return (
    <>
      <div className="my-1 px-3 text-menu-item font-semibold uppercase text-text">{label}</div>
      <div className="my-1">
        {items.map((item) => (
          <LinkedItemsSectionItem
            key={item.uuid}
            item={item}
            getItemIcon={getItemIcon}
            getTitleForLinkedTag={getTitleForLinkedTag}
            searchQuery={searchQuery}
            unlinkItem={unlinkItem}
          />
        ))}
      </div>
    </>
  )
}

const LinkedItemsPanel = ({ linkingController }: { linkingController: LinkingController }) => {
  const {
    tags,
    files,
    notes,
    getTitleForLinkedTag,
    getLinkedItemIcon,
    getSearchResults,
    linkItemToSelectedItem,
    unlinkItemFromSelectedItem: unlinkItem,
    createAndAddNewTag,
  } = linkingController

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const isSearching = !!searchQuery.length
  const { linkedResults, unlinkedResults, shouldShowCreateTag } = getSearchResults(searchQuery)

  return (
    <div>
      <form className="sticky top-0 mb-3 border-b border-border bg-default px-2.5 py-2.5">
        <DecoratedInput
          type="text"
          className={{ container: !isSearching ? 'py-1.5 px-0.5' : 'py-0' }}
          placeholder="Search items..."
          value={searchQuery}
          onChange={setSearchQuery}
          ref={searchInputRef}
          right={[
            isSearching && (
              <ClearInputButton
                onClick={() => {
                  setSearchQuery('')
                  searchInputRef.current?.focus()
                }}
              />
            ),
          ]}
        />
      </form>
      {isSearching ? (
        <>
          {(!!unlinkedResults.length || shouldShowCreateTag) && (
            <div className="my-1 px-3 text-menu-item font-semibold uppercase text-text">Unlinked</div>
          )}
          <LinkedItemSearchResults
            createAndAddNewTag={createAndAddNewTag}
            getLinkedItemIcon={getLinkedItemIcon}
            getTitleForLinkedTag={getTitleForLinkedTag}
            linkItemToSelectedItem={linkItemToSelectedItem}
            results={unlinkedResults}
            searchQuery={searchQuery}
            shouldShowCreateTag={shouldShowCreateTag}
          />
          <LinkedItemsSection
            label="Linked"
            items={linkedResults}
            getItemIcon={getLinkedItemIcon}
            getTitleForLinkedTag={getTitleForLinkedTag}
            searchQuery={searchQuery}
            unlinkItem={unlinkItem}
          />
        </>
      ) : (
        <>
          <LinkedItemsSection
            label="Linked Tags"
            items={tags}
            getItemIcon={getLinkedItemIcon}
            getTitleForLinkedTag={getTitleForLinkedTag}
            unlinkItem={unlinkItem}
          />
          <LinkedItemsSection
            label="Linked Files"
            items={files}
            getItemIcon={getLinkedItemIcon}
            getTitleForLinkedTag={getTitleForLinkedTag}
            unlinkItem={unlinkItem}
          />
          <LinkedItemsSection
            label="Linked Notes"
            items={notes}
            getItemIcon={getLinkedItemIcon}
            getTitleForLinkedTag={getTitleForLinkedTag}
            unlinkItem={unlinkItem}
          />
        </>
      )}
    </div>
  )
}

export default observer(LinkedItemsPanel)
