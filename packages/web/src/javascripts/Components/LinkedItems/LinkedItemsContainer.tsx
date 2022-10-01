import { observer } from 'mobx-react-lite'
import AutocompleteTagInput from '@/Components/TagAutocomplete/AutocompleteTagInput'
import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import LinkedItem from './LinkedItem'
import { WebApplication } from '@/Application/Application'
import { useCallback } from 'react'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'

type Props = {
  application: WebApplication
  noteTagsController: NoteTagsController
  linkingController: LinkingController
}

const LinkedItemsContainer = ({ application, noteTagsController, linkingController }: Props) => {
  const { toggleAppPane } = useResponsiveAppPane()
  const { allLinkedItems, unlinkItem, getItemTitle, getItemIcon, activateItem } = linkingController

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
          application={application}
          item={item}
          key={item.uuid}
          getItemIcon={getItemIcon}
          getItemTitle={getItemTitle}
          activateItem={activateItemAndTogglePane}
          unlinkItem={unlinkItem}
        />
      ))}
      <AutocompleteTagInput noteTagsController={noteTagsController} />
    </div>
  )
}

export default observer(LinkedItemsContainer)
