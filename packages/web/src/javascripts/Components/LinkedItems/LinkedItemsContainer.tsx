import { observer } from 'mobx-react-lite'
import ItemLinkAutocompleteInput from './ItemLinkAutocompleteInput'
import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import LinkedItemBubble from './LinkedItemBubble'
import { useCallback } from 'react'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'

type Props = {
  linkingController: LinkingController
}

const LinkedItemsContainer = ({ linkingController }: Props) => {
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
    <div className="mt-0.5 hidden min-w-80 max-w-full flex-wrap items-center gap-2 bg-transparent md:-mr-2 md:flex">
      {allLinkedItems.map((item) => (
        <LinkedItemBubble
          item={item}
          key={item.uuid}
          getItemIcon={getItemIcon}
          getTitleForLinkedTag={getTitleForLinkedTag}
          activateItem={activateItemAndTogglePane}
          unlinkItem={unlinkItem}
        />
      ))}
      <ItemLinkAutocompleteInput linkingController={linkingController} />
    </div>
  )
}

export default observer(LinkedItemsContainer)
