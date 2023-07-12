import { LinkingController } from '@/Controllers/LinkingController'
import { observer } from 'mobx-react-lite'
import { SNNote } from '@standardnotes/snjs'
import Icon from '../Icon/Icon'
import { PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'
import LinkedItemMeta from './LinkedItemMeta'
import { LinkableItem } from '@/Utils/Items/Search/LinkableItem'
import { LinkedItemSearchResultsAddTagOption } from './LinkedItemSearchResultsAddTagOption'
import { useCallback } from 'react'

type Props = {
  createAndAddNewTag: LinkingController['createAndAddNewTag']
  linkItems: LinkingController['linkItems']
  results: LinkableItem[]
  searchQuery: string
  shouldShowCreateTag: boolean
  onClickCallback?: () => void
  isEntitledToNoteLinking: boolean
  item: LinkableItem
}

const LinkedItemSearchResults = ({
  createAndAddNewTag,
  linkItems,
  results,
  searchQuery,
  shouldShowCreateTag,
  onClickCallback,
  isEntitledToNoteLinking,
  item,
}: Props) => {
  const onClickAddNew = useCallback(
    (searchQuery: string) => {
      void createAndAddNewTag(searchQuery)
      onClickCallback?.()
    },
    [createAndAddNewTag, onClickCallback],
  )

  return (
    <div className="my-1">
      {results.map((result) => {
        const cannotLinkItem = !isEntitledToNoteLinking && result instanceof SNNote
        return (
          <button
            key={result.uuid}
            className="flex w-full items-center justify-between gap-4 overflow-hidden px-3 py-2 hover:bg-contrast hover:text-foreground focus:bg-info-backdrop"
            onClick={() => {
              void linkItems(item, result)
              onClickCallback?.()
            }}
          >
            <LinkedItemMeta item={result} searchQuery={searchQuery} />
            {cannotLinkItem && <Icon type={PremiumFeatureIconName} className="ml-auto flex-shrink-0 text-info" />}
          </button>
        )
      })}
      {shouldShowCreateTag && (
        <LinkedItemSearchResultsAddTagOption searchQuery={searchQuery} onClickCallback={onClickAddNew} />
      )}
    </div>
  )
}

export default observer(LinkedItemSearchResults)
