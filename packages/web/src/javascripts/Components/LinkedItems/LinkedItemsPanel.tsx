import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
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

const LinkedItemsPanel = ({ linkingController, isOpen }: { linkingController: LinkingController; isOpen: boolean }) => {
  const {
    tags,
    files,
    notesLinkedToItem,
    notesLinkingToItem,
    getTitleForLinkedTag,
    getLinkedItemIcon,
    getSearchResults,
    linkItemToSelectedItem,
    unlinkItemFromSelectedItem,
    activateItem,
    createAndAddNewTag,
  } = linkingController

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const isSearching = !!searchQuery.length
  const { linkedResults, unlinkedResults, shouldShowCreateTag } = getSearchResults(searchQuery)

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  return (
    <div className="divide-y divide-border">
      <form className="sticky top-0 px-2.5 py-2.5">
        <DecoratedInput
          type="text"
          className={{ container: !isSearching ? 'py-1.5 px-0.5' : 'py-0' }}
          placeholder="Search items to link..."
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
            <div>
              <div className="mt-3 mb-1 px-3 text-menu-item font-semibold uppercase text-passive-0">Unlinked</div>
              <LinkedItemSearchResults
                createAndAddNewTag={createAndAddNewTag}
                getLinkedItemIcon={getLinkedItemIcon}
                getTitleForLinkedTag={getTitleForLinkedTag}
                linkItemToSelectedItem={linkItemToSelectedItem}
                results={unlinkedResults}
                searchQuery={searchQuery}
                shouldShowCreateTag={shouldShowCreateTag}
              />
            </div>
          )}
          {!!linkedResults.length && (
            <div>
              <div className="mt-3 mb-1 px-3 text-menu-item font-semibold uppercase text-passive-0">Linked</div>
              <div className="my-1">
                {linkedResults.map((item) => (
                  <LinkedItemsSectionItem
                    key={item.uuid}
                    item={item}
                    getItemIcon={getLinkedItemIcon}
                    getTitleForLinkedTag={getTitleForLinkedTag}
                    searchQuery={searchQuery}
                    unlinkItem={unlinkItemFromSelectedItem}
                    activateItem={activateItem}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {!!tags.length && (
            <div>
              <div className="mt-3 mb-1 px-3 text-menu-item font-semibold uppercase text-passive-0">Linked Tags</div>
              <div className="my-1">
                {tags.map((item) => (
                  <LinkedItemsSectionItem
                    key={item.uuid}
                    item={item}
                    getItemIcon={getLinkedItemIcon}
                    getTitleForLinkedTag={getTitleForLinkedTag}
                    searchQuery={searchQuery}
                    unlinkItem={unlinkItemFromSelectedItem}
                    activateItem={activateItem}
                  />
                ))}
              </div>
            </div>
          )}
          {!!files.length && (
            <div>
              <div className="mt-3 mb-1 px-3 text-menu-item font-semibold uppercase text-passive-0">Linked Files</div>
              <div className="my-1">
                {files.map((item) => (
                  <LinkedItemsSectionItem
                    key={item.uuid}
                    item={item}
                    getItemIcon={getLinkedItemIcon}
                    getTitleForLinkedTag={getTitleForLinkedTag}
                    searchQuery={searchQuery}
                    unlinkItem={unlinkItemFromSelectedItem}
                    activateItem={activateItem}
                  />
                ))}
              </div>
            </div>
          )}
          {!!notesLinkedToItem.length && (
            <div>
              <div className="mt-3 mb-1 px-3 text-menu-item font-semibold uppercase text-passive-0">Linked Notes</div>
              <div className="my-1">
                {notesLinkedToItem.map((item) => (
                  <LinkedItemsSectionItem
                    key={item.uuid}
                    item={item}
                    getItemIcon={getLinkedItemIcon}
                    getTitleForLinkedTag={getTitleForLinkedTag}
                    searchQuery={searchQuery}
                    unlinkItem={unlinkItemFromSelectedItem}
                    activateItem={activateItem}
                  />
                ))}
              </div>
            </div>
          )}
          {!!notesLinkingToItem.length && (
            <div>
              <div className="mt-3 mb-1 px-3 text-menu-item font-semibold uppercase text-passive-0">
                Notes Linking To This Note
              </div>
              <div className="my-1">
                {notesLinkingToItem.map((item) => (
                  <LinkedItemsSectionItem
                    key={item.uuid}
                    item={item}
                    getItemIcon={getLinkedItemIcon}
                    getTitleForLinkedTag={getTitleForLinkedTag}
                    searchQuery={searchQuery}
                    unlinkItem={unlinkItemFromSelectedItem}
                    activateItem={activateItem}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default observer(LinkedItemsPanel)
