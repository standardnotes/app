import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import { observer } from 'mobx-react-lite'
import Icon from '../Icon/Icon'
import LinkedItemMeta from './LinkedItemMeta'

type Props = {
  createAndAddNewTag: LinkingController['createAndAddNewTag']
  getLinkedItemIcon: LinkingController['getLinkedItemIcon']
  getTitleForLinkedTag: LinkingController['getTitleForLinkedTag']
  linkItemToSelectedItem: LinkingController['linkItemToSelectedItem']
  results: LinkableItem[]
  searchQuery: string
  shouldShowCreateTag: boolean
}

const LinkedItemSearchResults = ({
  createAndAddNewTag,
  getLinkedItemIcon,
  getTitleForLinkedTag,
  linkItemToSelectedItem,
  results,
  searchQuery,
  shouldShowCreateTag,
}: Props) => {
  return (
    <div className="my-1">
      {results.map((result) => {
        return (
          <button
            key={result.uuid}
            className="flex w-full items-center justify-between gap-4 overflow-hidden py-2 px-3 hover:bg-contrast hover:text-foreground focus:bg-info-backdrop"
            onClick={() => linkItemToSelectedItem(result)}
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
      {shouldShowCreateTag && (
        <button
          className="group flex w-full items-center gap-2 overflow-hidden py-2 px-3 hover:bg-contrast hover:text-foreground focus:bg-info-backdrop"
          onClick={() => createAndAddNewTag(searchQuery)}
        >
          <span className="flex-shrink-0 align-middle">Create &amp; add tag</span>{' '}
          <span className="inline-flex min-w-0 items-center gap-1 rounded bg-contrast py-1 pl-1 pr-2 align-middle text-xs text-text group-hover:bg-info group-hover:text-info-contrast">
            <Icon type="hashtag" className="flex-shrink-0 text-info group-hover:text-info-contrast" size="small" />
            <span className="min-w-0 overflow-hidden text-ellipsis">{searchQuery}</span>
          </span>
        </button>
      )}
    </div>
  )
}

export default observer(LinkedItemSearchResults)
