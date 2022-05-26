import { AppState } from '@/UIModels/AppState'
import { isStateDealloced } from '@/UIModels/AppState/AbstractState'
import { isMobile } from '@/Utils'
import { SNTag } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend'
import RootTagDropZone from './RootTagDropZone'
import { TagsListItem } from './TagsListItem'

type Props = {
  appState: AppState
}

const TagsList: FunctionComponent<Props> = ({ appState }: Props) => {
  if (isStateDealloced(appState)) {
    return null
  }

  const tagsState = appState.tags
  const allTags = tagsState.allLocalRootTags

  const backend = isMobile({ tablet: true }) ? TouchBackend : HTML5Backend

  const openTagContextMenu = useCallback(
    (posX: number, posY: number) => {
      appState.tags.setContextMenuClickLocation({
        x: posX,
        y: posY,
      })
      appState.tags.reloadContextMenuLayout()
      appState.tags.setContextMenuOpen(true)
    },
    [appState],
  )

  const onContextMenu = useCallback(
    (tag: SNTag, posX: number, posY: number) => {
      appState.tags.selected = tag
      openTagContextMenu(posX, posY)
    },
    [appState, openTagContextMenu],
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
                features={appState.features}
                onContextMenu={onContextMenu}
              />
            )
          })}
          <RootTagDropZone tagsState={appState.tags} featuresState={appState.features} />
        </>
      )}
    </DndProvider>
  )
}

export default observer(TagsList)
