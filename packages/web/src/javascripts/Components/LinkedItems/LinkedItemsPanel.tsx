import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { observer } from 'mobx-react-lite'
import { useRef, useState } from 'react'
import Icon from '../Icon/Icon'

const LinkedItem = ({
  item,
  getItemIcon,
  getTitleForLinkedTag,
}: {
  item: LinkableItem
  getItemIcon: LinkingController['getLinkedItemIcon']
  getTitleForLinkedTag: LinkingController['getTitleForLinkedTag']
}) => {
  const [icon, className] = getItemIcon(item)
  const tagTitle = getTitleForLinkedTag(item)

  return (
    <div className="flex items-center justify-between gap-4 py-1 px-3">
      <Icon type={icon} className={classNames('flex-shrink-0', className)} />
      <div className="min-w-0 flex-grow break-words text-left text-sm">
        {tagTitle && <span className="text-passive-1">{tagTitle.titlePrefix}</span>}
        {item.title}
      </div>
      <button className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-1 hover:bg-contrast">
        <Icon type="more" className="text-neutral" />
      </button>
    </div>
  )
}

const LinkedItemsSection = ({
  label,
  items,
  getItemIcon,
  getTitleForLinkedTag,
}: {
  label: string
  items: LinkableItem[]
  getItemIcon: LinkingController['getLinkedItemIcon']
  getTitleForLinkedTag: LinkingController['getTitleForLinkedTag']
}) => {
  if (!items.length) {
    return null
  }

  return (
    <>
      <div className="my-1 px-3 text-menu-item font-semibold uppercase text-text">{label}</div>
      <div className="my-1">
        {items.map((item) => (
          <LinkedItem
            item={item}
            getItemIcon={getItemIcon}
            getTitleForLinkedTag={getTitleForLinkedTag}
            key={item.uuid}
          />
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
        <div className="relative">
          <input
            type="text"
            className="w-full rounded border border-solid border-border bg-default py-1.5 px-3 text-sm text-text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            ref={searchInputRef}
          />
          {isSearching && (
            <button
              onClick={() => {
                setSearchQuery('')
                searchInputRef.current?.focus()
              }}
              className="absolute right-2 top-1/2 flex h-4.5 w-4.5 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-neutral text-neutral-contrast"
            >
              <Icon type="close" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>
      {isSearching ? (
        <>
          <div className="my-1 px-3 text-menu-item font-semibold uppercase text-text">Unlinked</div>
          <div className="my-1">
            {unlinkedResults.map((result) => {
              const [icon, className] = getLinkedItemIcon(result)
              const tagTitle = getTitleForLinkedTag(result)

              return (
                <button
                  className="flex w-full items-center justify-between gap-4 overflow-hidden py-2 px-3 hover:bg-contrast hover:text-foreground focus:bg-info-backdrop"
                  onClick={() => linkItem(result)}
                >
                  <Icon type={icon} className={classNames('flex-shrink-0', className)} />
                  <div className="min-w-0 flex-grow break-words text-left text-sm">
                    {tagTitle && <span className="text-passive-1">{tagTitle.titlePrefix}</span>}
                    {result.title}
                  </div>
                </button>
              )
            })}
          </div>
          <LinkedItemsSection
            label="Linked"
            items={linkedResults}
            getItemIcon={getLinkedItemIcon}
            getTitleForLinkedTag={getTitleForLinkedTag}
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
