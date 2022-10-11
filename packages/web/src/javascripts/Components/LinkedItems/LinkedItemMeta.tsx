import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import { splitQueryInString } from '@/Utils'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { observer } from 'mobx-react-lite'
import Icon from '../Icon/Icon'

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

export default observer(LinkedItemMeta)
