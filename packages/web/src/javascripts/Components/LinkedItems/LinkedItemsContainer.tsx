import { observer } from 'mobx-react-lite'
import ItemLinkAutocompleteInput from './ItemLinkAutocompleteInput'
import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import LinkedItemBubble from './LinkedItemBubble'
import { useCallback, useRef, useState } from 'react'
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

  const [focusedId, setFocusedId] = useState<string>()
  const focusableRefs = useRef<Map<string, HTMLButtonElement | HTMLInputElement>>(new Map())

  const focusPreviousItem = useCallback(() => {
    const focusableItems = Array.from(focusableRefs.current.entries())
    const currentFocusedIndex = focusableItems.findIndex(([id]) => id === focusedId)
    const previousIndex = currentFocusedIndex - 1

    if (previousIndex > -1) {
      focusableItems[previousIndex][1].focus()
    }
  }, [focusedId])

  const focusNextItem = useCallback(() => {
    const focusableItems = Array.from(focusableRefs.current.entries())
    const currentFocusedIndex = focusableItems.findIndex(([id]) => id === focusedId)
    const nextIndex = currentFocusedIndex + 1

    if (nextIndex < focusableItems.length) {
      focusableItems[nextIndex][1].focus()
    }
  }, [focusedId])

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
          onFocus={() => {
            setFocusedId(item.uuid)
          }}
          ref={(node) => {
            if (node) {
              focusableRefs.current = focusableRefs.current.set(item.uuid, node)
            }
          }}
        />
      ))}
      <ItemLinkAutocompleteInput
        ref={(node) => {
          if (node) {
            focusableRefs.current = focusableRefs.current.set('input', node)
          }
        }}
        linkingController={linkingController}
        focusPreviousItem={focusPreviousItem}
        onFocus={() => {
          setFocusedId('input')
        }}
      />
    </div>
  )
}

export default observer(LinkedItemsContainer)
