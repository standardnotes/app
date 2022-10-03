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
  activateItem,
  getItemIcon,
  getTitleForLinkedTag,
  item,
  searchQuery,
  unlinkItem,
}: {
  activateItem: LinkingController['activateItem']
  getItemIcon: LinkingController['getLinkedItemIcon']
  getTitleForLinkedTag: LinkingController['getTitleForLinkedTag']
  item: LinkableItem
  searchQuery?: string
  unlinkItem: LinkingController['unlinkItemFromSelectedItem']
}) => {
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const toggleMenu = () => setIsMenuOpen((open) => !open)

  return (
    <div className="relative flex items-center justify-between">
      <button
        className="flex flex-grow items-center justify-between gap-4 py-2 pl-3 pr-11 text-sm hover:bg-info-backdrop focus:bg-info-backdrop"
        onClick={() => activateItem(item)}
      >
        <LinkedItemMeta
          item={item}
          getItemIcon={getItemIcon}
          getTitleForLinkedTag={getTitleForLinkedTag}
          searchQuery={searchQuery}
        />
      </button>
      <button
        className="absolute right-3 top-1/2 h-7 w-7 -translate-y-1/2 cursor-pointer rounded-full border-0 bg-transparent p-1 hover:bg-contrast"
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
    activateItem,
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
          {!!linkedResults.length && (
            <>
              <div className="my-1 px-3 text-menu-item font-semibold uppercase text-text">Linked</div>
              <div className="my-1">
                {linkedResults.map((item) => (
                  <LinkedItemsSectionItem
                    key={item.uuid}
                    item={item}
                    getItemIcon={getLinkedItemIcon}
                    getTitleForLinkedTag={getTitleForLinkedTag}
                    searchQuery={searchQuery}
                    unlinkItem={unlinkItem}
                    activateItem={activateItem}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {!!tags.length && (
            <>
              <div className="my-1 px-3 text-menu-item font-semibold uppercase text-text">Linked Tags</div>
              <div className="my-1">
                {tags.map((item) => (
                  <LinkedItemsSectionItem
                    key={item.uuid}
                    item={item}
                    getItemIcon={getLinkedItemIcon}
                    getTitleForLinkedTag={getTitleForLinkedTag}
                    searchQuery={searchQuery}
                    unlinkItem={unlinkItem}
                    activateItem={activateItem}
                  />
                ))}
              </div>
            </>
          )}
          {!!files.length && (
            <>
              <div className="my-1 px-3 text-menu-item font-semibold uppercase text-text">Linked Files</div>
              <div className="my-1">
                {files.map((item) => (
                  <LinkedItemsSectionItem
                    key={item.uuid}
                    item={item}
                    getItemIcon={getLinkedItemIcon}
                    getTitleForLinkedTag={getTitleForLinkedTag}
                    searchQuery={searchQuery}
                    unlinkItem={unlinkItem}
                    activateItem={activateItem}
                  />
                ))}
              </div>
            </>
          )}
          {!!notes.length && (
            <>
              <div className="my-1 px-3 text-menu-item font-semibold uppercase text-text">Linked Notes</div>
              <div className="my-1">
                {notes.map((item) => (
                  <LinkedItemsSectionItem
                    key={item.uuid}
                    item={item}
                    getItemIcon={getLinkedItemIcon}
                    getTitleForLinkedTag={getTitleForLinkedTag}
                    searchQuery={searchQuery}
                    unlinkItem={unlinkItem}
                    activateItem={activateItem}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default observer(LinkedItemsPanel)
