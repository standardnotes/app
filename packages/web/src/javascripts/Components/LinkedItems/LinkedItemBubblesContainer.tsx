import { observer } from 'mobx-react-lite'
import ItemLinkAutocompleteInput from './ItemLinkAutocompleteInput'
import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import LinkedItemBubble from './LinkedItemBubble'
import { useCallback, useState } from 'react'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { ElementIds } from '@/Constants/ElementIDs'

type Props = {
  linkingController: LinkingController
}

const LinkedItemBubblesContainer = ({ linkingController }: Props) => {
  const { toggleAppPane } = useResponsiveAppPane()
  const {
    allLinkedItems,
    unlinkItemFromSelectedItem: unlinkItem,
    getTitleForLinkedTag,
    getLinkedItemIcon: getItemIcon,
    activateItem,
  } = linkingController

  const [focusedId, setFocusedId] = useState<string>()
  const focusableIds = allLinkedItems.map((item) => item.uuid).concat([ElementIds.ItemLinkAutocompleteInput])

  const focusPreviousItem = useCallback(() => {
    const currentFocusedIndex = focusableIds.findIndex((id) => id === focusedId)
    const previousIndex = currentFocusedIndex - 1

    if (previousIndex > -1) {
      setFocusedId(focusableIds[previousIndex])
    }
  }, [focusableIds, focusedId])

  const focusNextItem = useCallback(() => {
    const currentFocusedIndex = focusableIds.findIndex((id) => id === focusedId)
    const nextIndex = currentFocusedIndex + 1

    if (nextIndex < focusableIds.length) {
      setFocusedId(focusableIds[nextIndex])
    }
  }, [focusableIds, focusedId])

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
    <div className="mt-2 hidden min-w-80 max-w-full flex-wrap items-center gap-2 bg-transparent md:-mr-2 md:flex">
      {allLinkedItems.map((item) => (
        <LinkedItemBubble
          item={item}
          key={item.uuid}
          getItemIcon={getItemIcon}
          getTitleForLinkedTag={getTitleForLinkedTag}
          activateItem={activateItemAndTogglePane}
          unlinkItem={unlinkItem}
          focusPreviousItem={focusPreviousItem}
          focusNextItem={focusNextItem}
          focusedId={focusedId}
          setFocusedId={setFocusedId}
        />
      ))}
      <ItemLinkAutocompleteInput
        focusedId={focusedId}
        linkingController={linkingController}
        focusPreviousItem={focusPreviousItem}
        setFocusedId={setFocusedId}
      />
    </div>
  )
}

export default observer(LinkedItemBubblesContainer)
