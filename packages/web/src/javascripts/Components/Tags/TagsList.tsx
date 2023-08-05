import { SNTag } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'
import RootTagDropZone from './RootTagDropZone'
import { TagListSectionType } from './TagListSection'
import { TagsListItem } from './TagsListItem'
import { useApplication } from '../ApplicationProvider'

type Props = {
  type: TagListSectionType
}

const TagsList: FunctionComponent<Props> = ({ type }: Props) => {
  const application = useApplication()

  const allTags =
    type === 'all' ? application.navigationController.allLocalRootTags : application.navigationController.starredTags

  const openTagContextMenu = useCallback(
    (posX: number, posY: number) => {
      application.navigationController.setContextMenuClickLocation({
        x: posX,
        y: posY,
      })
      application.navigationController.reloadContextMenuLayout()
      application.navigationController.setContextMenuOpen(true)
    },
    [application],
  )

  const onContextMenu = useCallback(
    (tag: SNTag, posX: number, posY: number) => {
      void application.navigationController.setSelectedTag(tag, type)
      openTagContextMenu(posX, posY)
    },
    [application, openTagContextMenu, type],
  )

  return (
    <>
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
                navigationController={application.navigationController}
                features={application.featuresController}
                linkingController={application.linkingController}
                onContextMenu={onContextMenu}
              />
            )
          })}
          {type === 'all' && <RootTagDropZone tagsState={application.navigationController} />}
        </>
      )}
    </>
  )
}

export default observer(TagsList)
