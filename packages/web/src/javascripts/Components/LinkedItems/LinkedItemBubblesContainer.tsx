import { observer } from 'mobx-react-lite'
import ItemLinkAutocompleteInput from './ItemLinkAutocompleteInput'
import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import LinkedItemBubble from './LinkedItemBubble'
import { useCallback, useState } from 'react'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { ElementIds } from '@/Constants/ElementIDs'
import { classNames } from '@/Utils/ConcatenateClassNames'

type Props = {
  linkingController: LinkingController
}

const LinkedItemBubblesContainer = ({ linkingController }: Props) => {
  const { toggleAppPane } = useResponsiveAppPane()
  const {
    allItemLinks,
    notesLinkingToItem,
    unlinkItemFromSelectedItem: unlinkItem,
    getTitleForLinkedTag,
    getLinkedItemIcon: getItemIcon,
    activateItem,
    selectedItemTitle,
  } = linkingController

  const [focusedId, setFocusedId] = useState<string>()
  const focusableIds = allItemLinks
    .map((link) => link.id)
    .concat(
      notesLinkingToItem.map((link) => link.id),
      [ElementIds.ItemLinkAutocompleteInput],
    )

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
    <div
      className={classNames(
        'hidden min-w-80 max-w-full flex-wrap items-center gap-2 bg-transparent md:-mr-2 md:flex',
        allItemLinks.length || notesLinkingToItem.length ? 'mt-1' : 'mt-0.5',
      )}
    >
      {allItemLinks.concat(notesLinkingToItem).map((link) => (
        <LinkedItemBubble
          link={link}
          key={link.id}
          getItemIcon={getItemIcon}
          getTitleForLinkedTag={getTitleForLinkedTag}
          activateItem={activateItemAndTogglePane}
          unlinkItem={unlinkItem}
          focusPreviousItem={focusPreviousItem}
          focusNextItem={focusNextItem}
          focusedId={focusedId}
          setFocusedId={setFocusedId}
          selectedItemTitle={selectedItemTitle}
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
