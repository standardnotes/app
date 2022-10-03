import { observer } from 'mobx-react-lite'
import AutocompleteTagInput from '@/Components/TagAutocomplete/AutocompleteTagInput'
import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import LinkedItem from './LinkedItem'
import { useCallback } from 'react'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'

type Props = {
  noteTagsController: NoteTagsController
  linkingController: LinkingController
}

const LinkedItemsContainer = ({ noteTagsController, linkingController }: Props) => {
  const { toggleAppPane } = useResponsiveAppPane()
  const {
    allLinkedItems,
    unlinkItemFromSelectedItem: unlinkItem,
    getTitleForLinkedTag,
    getLinkedItemIcon: getItemIcon,
    activateItem,
  } = linkingController

  const activateItemAndTogglePane = useCallback(
    async (item: LinkableItem) => {
      const paneId = await activateItem(item)
      if (paneId) {
        toggleAppPane(paneId)
      }
    },
    [activateItem, toggleAppPane],
  )

  return (
    <div className="flex min-w-80 max-w-full flex-wrap bg-transparent md:-mr-2 md:flex">
      {allLinkedItems.map((item) => (
        <LinkedItem
          item={item}
          key={item.uuid}
          getItemIcon={getItemIcon}
          getTitleForLinkedTag={getTitleForLinkedTag}
          activateItem={activateItemAndTogglePane}
          unlinkItem={unlinkItem}
        />
      ))}
      <AutocompleteTagInput noteTagsController={noteTagsController} />
    </div>
  )
}

export default observer(LinkedItemsContainer)
