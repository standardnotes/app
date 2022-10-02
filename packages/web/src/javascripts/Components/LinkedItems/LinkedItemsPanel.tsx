import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import { splitQueryInString } from '@/Utils'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { observer } from 'mobx-react-lite'
import { useRef, useState } from 'react'
import ClearInputButton from '../ClearInputButton/ClearInputButton'
import Icon from '../Icon/Icon'
import DecoratedInput from '../Input/DecoratedInput'

const LinkedItemMeta = ({
  item,
  getItemIcon,
  getTitleForLinkedTag,
  searchQuery,
}: {
  item: LinkableItem
  getItemIcon: LinkingController['getLinkedItemIcon']
  getTitleForLinkedTag: LinkingController['getTitleForLinkedTag']
  searchQuery?: string
}) => {
  const [icon, className] = getItemIcon(item)
  const tagTitle = getTitleForLinkedTag(item)
  const title = item.title ?? ''

  return (
    <>
      <Icon type={icon} className={classNames('flex-shrink-0', className)} />
      <div className="min-w-0 flex-grow break-words text-left text-sm">
        {tagTitle && <span className="text-passive-1">{tagTitle.titlePrefix}</span>}
        {searchQuery
          ? splitQueryInString(title, searchQuery).map((substring, index) => (
              <span
                key={index}
                className={`${
                  substring.toLowerCase() === searchQuery.toLowerCase()
                    ? 'whitespace-pre-wrap font-bold'
                    : 'whitespace-pre-wrap '
                }`}
              >
                {substring}
              </span>
            ))
          : title}
      </div>
    </>
  )
}

const LinkedItemsSection = ({
  label,
  items,
  getItemIcon,
  getTitleForLinkedTag,
  searchQuery,
}: {
  label: string
  items: LinkableItem[]
  getItemIcon: LinkingController['getLinkedItemIcon']
  getTitleForLinkedTag: LinkingController['getTitleForLinkedTag']
  searchQuery?: string
}) => {
  if (!items.length) {
    return null
  }

  return (
    <>
      <div className="my-1 px-3 text-menu-item font-semibold uppercase text-text">{label}</div>
      <div className="my-1">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-4 py-1 px-3">
            <LinkedItemMeta
              item={item}
              getItemIcon={getItemIcon}
              getTitleForLinkedTag={getTitleForLinkedTag}
              searchQuery={searchQuery}
            />
            <button className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-1 hover:bg-contrast">
              <Icon type="more" className="text-neutral" />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

const LinkedItemsPanel = ({ linkingController }: { linkingController: LinkingController }) => {
  const { tags, files, notes, getTitleForLinkedTag, getLinkedItemIcon, getSearchResults, linkItem } = linkingController

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const isSearching = !!searchQuery.length
  const { linkedResults, unlinkedResults } = isSearching
    ? getSearchResults(searchQuery)
    : {
        linkedResults: [],
        unlinkedResults: [],
      }

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
          <div className="my-1 px-3 text-menu-item font-semibold uppercase text-text">Unlinked</div>
          <div className="my-1">
            {unlinkedResults.map((result) => {
              return (
                <button
                  className="flex w-full items-center justify-between gap-4 overflow-hidden py-2 px-3 hover:bg-contrast hover:text-foreground focus:bg-info-backdrop"
                  onClick={() => linkItem(result)}
                >
                  <LinkedItemMeta
                    item={result}
                    getItemIcon={getLinkedItemIcon}
                    getTitleForLinkedTag={getTitleForLinkedTag}
                    searchQuery={searchQuery}
                  />
                </button>
              )
            })}
          </div>
          <LinkedItemsSection
            label="Linked"
            items={linkedResults}
            getItemIcon={getLinkedItemIcon}
            getTitleForLinkedTag={getTitleForLinkedTag}
            searchQuery={searchQuery}
          />
        </>
      ) : (
        <>
          <LinkedItemsSection
            label="Linked Tags"
            items={tags}
            getItemIcon={getLinkedItemIcon}
            getTitleForLinkedTag={getTitleForLinkedTag}
          />
          <LinkedItemsSection
            label="Linked Files"
            items={files}
            getItemIcon={getLinkedItemIcon}
            getTitleForLinkedTag={getTitleForLinkedTag}
          />
          <LinkedItemsSection
            label="Linked Notes"
            items={notes}
            getItemIcon={getLinkedItemIcon}
            getTitleForLinkedTag={getTitleForLinkedTag}
          />
        </>
      )}
    </div>
  )
}

export default observer(LinkedItemsPanel)
