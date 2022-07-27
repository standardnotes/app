import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { SNTag } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import RootTagDropZone from './RootTagDropZone'
import { TagsListItem } from './TagsListItem'

type Props = {
  viewControllerManager: ViewControllerManager
  isCollapsed: boolean
}

const TagsList: FunctionComponent<Props> = ({ viewControllerManager, isCollapsed }: Props) => {
  const tagsState = viewControllerManager.navigationController
  const allTags = tagsState.allLocalRootTags

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
      void viewControllerManager.navigationController.setSelectedTag(tag)
      openTagContextMenu(posX, posY)
    },
    [viewControllerManager, openTagContextMenu],
  )

  return (
    <DndProvider backend={backend}>
      {allTags.length === 0 ? (
        <div className="no-tags-placeholder">No tags or folders. Create one using the add button above.</div>
      ) : (
        <>
          {allTags.map((tag) => {
            return (
              <TagsListItem
                level={0}
                key={tag.uuid}
                tag={tag}
                tagsState={tagsState}
                features={viewControllerManager.featuresController}
                onContextMenu={onContextMenu}
                isCollapsed={isCollapsed}
              />
            )
          })}
          <RootTagDropZone
            tagsState={viewControllerManager.navigationController}
            featuresState={viewControllerManager.featuresController}
          />
        </>
      )}
    </DndProvider>
  )
}

export default observer(TagsList)
