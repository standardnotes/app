import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { observer } from 'mobx-react-lite'
import { SNNote } from '@standardnotes/snjs'
import Icon from '../Icon/Icon'
import { PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'
import LinkedItemMeta from './LinkedItemMeta'

type Props = {
  createAndAddNewTag: LinkingController['createAndAddNewTag']
  getLinkedItemIcon: LinkingController['getLinkedItemIcon']
  getTitleForLinkedTag: LinkingController['getTitleForLinkedTag']
  linkItemToSelectedItem: LinkingController['linkItemToSelectedItem']
  results: LinkableItem[]
  searchQuery: string
  shouldShowCreateTag: boolean
  onClickCallback?: () => void
  isEntitledToNoteLinking: boolean
}

const LinkedItemSearchResults = ({
  createAndAddNewTag,
  getLinkedItemIcon,
  getTitleForLinkedTag,
  linkItemToSelectedItem,
  results,
  searchQuery,
  shouldShowCreateTag,
  onClickCallback,
  isEntitledToNoteLinking,
}: Props) => {
  const premiumModal = usePremiumModal()

  return (
    <div className="my-1">
      {results.map((result) => {
        return (
          <button
            key={result.uuid}
            className="flex w-full items-center justify-between gap-4 overflow-hidden py-2 px-3 hover:bg-contrast hover:text-foreground focus:bg-info-backdrop"
            onClick={() => {
              if (isEntitledToNoteLinking) {
                linkItemToSelectedItem(result)
                onClickCallback?.()
              } else {
                premiumModal.activate('Note linking')
              }
            }}
          >
            <LinkedItemMeta
              item={result}
              getItemIcon={getLinkedItemIcon}
              getTitleForLinkedTag={getTitleForLinkedTag}
              searchQuery={searchQuery}
            />
            {!isEntitledToNoteLinking && result instanceof SNNote && (
              <Icon type={PremiumFeatureIconName} className="ml-auto flex-shrink-0 text-info" />
            )}
          </button>
        )
      })}
      {shouldShowCreateTag && (
        <button
          className="group flex w-full items-center gap-2 overflow-hidden py-2 px-3 hover:bg-contrast hover:text-foreground focus:bg-info-backdrop"
          onClick={() => {
            createAndAddNewTag(searchQuery)
            onClickCallback?.()
          }}
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
