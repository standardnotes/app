import ItemSelectionDropdown from '@/Components/ItemSelectionDropdown/ItemSelectionDropdown'
import LinkedItemBubble from '@/Components/LinkedItems/LinkedItemBubble'
import { useApplication } from '@/Components/ApplicationProvider'
import { ElementIds } from '@/Constants/ElementIDs'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import { createLinkFromItem } from '@/Utils/Items/Search/createLinkFromItem'
import { ContentType, SNTag } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'

type Props = {
  searchOptions: SearchOptionsController
}

const SearchTagFilters = ({ searchOptions }: Props) => {
  const application = useApplication()
  const { tagFilterList } = searchOptions
  const selected = application.navigationController.selected

  const excludeUuids = tagFilterList.map((tag) => tag.uuid)
  if (selected instanceof SNTag && !excludeUuids.includes(selected.uuid)) {
    excludeUuids.push(selected.uuid)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tagFilterList.map((tag) => (
        <LinkedItemBubble
          key={tag.uuid}
          className="m-0"
          link={createLinkFromItem(tag, 'linked')}
          unlinkItem={async (item) => {
            searchOptions.removeTagFilter(item as SNTag)
            document.getElementById(ElementIds.SearchBar)?.focus()
          }}
          isBidirectional={false}
          inlineFlex={true}
        />
      ))}
      <ItemSelectionDropdown
        onSelection={(item) => searchOptions.addTagFilter(item as SNTag)}
        placeholder="Add tag..."
        contentTypes={[ContentType.TYPES.Tag]}
        excludeUuids={excludeUuids}
      />
    </div>
  )
}

export default observer(SearchTagFilters)
