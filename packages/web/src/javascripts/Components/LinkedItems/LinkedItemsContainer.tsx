import { observer } from 'mobx-react-lite'
import AutocompleteTagInput from '@/Components/TagAutocomplete/AutocompleteTagInput'
import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { LinkableItem, LinkingController } from '@/Controllers/LinkingController'
import LinkedItem from './LinkedItem'
import { WebApplication } from '@/Application/Application'
import { useCallback } from 'react'
import { ContentType, IconType, SNTag } from '@standardnotes/snjs'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'

type Props = {
  application: WebApplication
  noteTagsController: NoteTagsController
  navigationController: NavigationController
  linkingController: LinkingController
  selectionController: SelectedItemsController
}

const LinkedItemsContainer = ({
  application,
  noteTagsController,
  navigationController,
  linkingController,
  selectionController,
}: Props) => {
  const { toggleAppPane } = useResponsiveAppPane()
  const { tags, files, unlinkItem } = linkingController

  const getItemIcon = useCallback((item: LinkableItem): IconType => {
    switch (item.content_type) {
      case ContentType.Note:
        return 'notes'
      case ContentType.File:
        return 'file'
      default:
        return 'hashtag'
    }
  }, [])

  const getItemTitle = useCallback(
    (item: LinkableItem) => {
      if (item instanceof SNTag) {
        const prefixTitle = application.items.getTagPrefixTitle(item)
        return (
          <>
            {prefixTitle && <span className="text-passive-1">{prefixTitle}</span>}
            {item.title}
          </>
        )
      }

      return <>{item.title}</>
    },
    [application.items],
  )

  const activateItem = useCallback(
    async (item: LinkableItem) => {
      if (item instanceof SNTag) {
        await navigationController.setSelectedTag(item)
        toggleAppPane(AppPaneId.Items)
      }

      const { didSelect } = await selectionController.selectItem(item.uuid, true)
      if (didSelect) {
        toggleAppPane(AppPaneId.Editor)
      }
    },
    [navigationController, selectionController, toggleAppPane],
  )

  return (
    <div className="hidden min-w-80 max-w-full flex-wrap bg-transparent md:-mr-2 md:flex">
      {[...tags, ...files].map((item) => (
        <LinkedItem
          application={application}
          item={item}
          key={item.uuid}
          getItemIcon={getItemIcon}
          getItemTitle={getItemTitle}
          activateItem={activateItem}
          unlinkItem={unlinkItem}
        />
      ))}
      <AutocompleteTagInput noteTagsController={noteTagsController} />
    </div>
  )
}

export default observer(LinkedItemsContainer)
