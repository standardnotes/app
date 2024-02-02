import { SNTag } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useState } from 'react'
import RootTagDropZone from './RootTagDropZone'
import { TagListSectionType } from './TagListSection'
import { TagsListItem } from './TagsListItem'
import { useApplication } from '../ApplicationProvider'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'

type Props = {
  type: TagListSectionType
}

const TagsList: FunctionComponent<Props> = ({ type }: Props) => {
  const application = useApplication()

  const allTags =
    type === 'all' ? application.navigationController.allLocalRootTags : application.navigationController.starredTags

  const openTagContextMenu = useCallback(
    (x: number, y: number) => {
      application.navigationController.setContextMenuClickLocation({ x, y })
      application.navigationController.setContextMenuOpen(true)
    },
    [application],
  )

  const onContextMenu = useCallback(
    (tag: SNTag, section: TagListSectionType, posX: number, posY: number) => {
      application.navigationController.setContextMenuTag(tag, section)
      openTagContextMenu(posX, posY)
    },
    [application, openTagContextMenu],
  )

  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  useListKeyboardNavigation(container, {
    initialFocus: 0,
    shouldAutoFocus: false,
    shouldWrapAround: false,
    resetLastFocusedOnBlur: true,
  })

  if (allTags.length === 0) {
    return (
      <div className="px-4 text-base opacity-50 lg:text-sm">
        {application.navigationController.isSearching
          ? 'No tags found. Try a different search.'
          : 'No tags or folders. Create one using the add button above.'}
      </div>
    )
  }

  return (
    <>
      <div ref={setContainer}>
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
      </div>
      {type === 'all' && <RootTagDropZone tagsState={application.navigationController} />}
    </>
  )
}

export default observer(TagsList)
