import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { SNTag } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import RootTagDropZone from './RootTagDropZone'
import { TagListSectionType } from './TagListSection'
import { TagsListItem } from './TagsListItem'

type Props = {
  viewControllerManager: ViewControllerManager
  type: TagListSectionType
}

const TagsList: FunctionComponent<Props> = ({ viewControllerManager, type }: Props) => {
  const navigationController = viewControllerManager.navigationController
  const allTags = type === 'all' ? navigationController.allLocalRootTags : navigationController.starredTags

  const backend = HTML5Backend

  const openTagContextMenu = useCallback(
    (posX: number, posY: number) => {
      viewControllerManager.navigationController.setContextMenuClickLocation({
        x: posX,
        y: posY,
      })
      viewControllerManager.navigationController.reloadContextMenuLayout()
      viewControllerManager.navigationController.setContextMenuOpen(true)
    },
    [viewControllerManager],
  )

  const onContextMenu = useCallback(
    (tag: SNTag, posX: number, posY: number) => {
      void viewControllerManager.navigationController.setSelectedTag(tag, type)
      openTagContextMenu(posX, posY)
    },
    [viewControllerManager, openTagContextMenu, type],
  )

  return (
    <DndProvider backend={backend}>
      {allTags.length === 0 ? (
        <div className="no-tags-placeholder text-base opacity-[0.4] lg:text-sm">
          No tags or folders. Create one using the add button above.
        </div>
      ) : (
        <>
          {allTags.map((tag) => {
            return (
              <TagsListItem
                level={0}
                key={tag.uuid}
                tag={tag}
                type={type}
                navigationController={navigationController}
                features={viewControllerManager.featuresController}
                linkingController={viewControllerManager.linkingController}
                onContextMenu={onContextMenu}
              />
            )
          })}
          {type === 'all' && (
            <RootTagDropZone
              tagsState={viewControllerManager.navigationController}
              featuresState={viewControllerManager.featuresController}
            />
          )}
        </>
      )}
    </DndProvider>
  )
}

export default observer(TagsList)
