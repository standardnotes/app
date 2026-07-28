import Icon from '@/Components/Icon/Icon'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { classNames } from '@standardnotes/utils'
import { observer } from 'mobx-react-lite'
import { DragEventHandler, FunctionComponent, useCallback, useState } from 'react'
import { TagDragDataFormat } from './DragNDrop'
import { c } from 'ttag'

type Props = {
  tagsState: NavigationController
}

const RootTagDropZone: FunctionComponent<Props> = ({ tagsState }) => {
  const [isOver, setIsOver] = useState(false)

  const removeDragIndicator = useCallback(() => {
    setIsOver(false)
  }, [])

  const onDragOver: DragEventHandler<HTMLDivElement> = useCallback((event): void => {
    if (event.dataTransfer.types.includes(TagDragDataFormat)) {
      event.preventDefault()
      setIsOver(true)
    }
  }, [])

  const onDrop: DragEventHandler<HTMLDivElement> = useCallback(
    (event): void => {
      setIsOver(false)
      const draggedTagUuid = event.dataTransfer.getData(TagDragDataFormat)
      if (!draggedTagUuid) {
        return
      }
      if (draggedTagUuid) {
        void tagsState.assignParent(draggedTagUuid, undefined)
      }
    },
    [tagsState],
  )

  return (
    <div
      className={classNames('root-drop', isOver && 'active is-drag-over')}
      onDragExit={removeDragIndicator}
      onDragOver={onDragOver}
      onDragLeave={removeDragIndicator}
      onDrop={onDrop}
    >
      <Icon className="text-neutral" type="link-off" />
      <p className="content">
        {c('B4.Notes.TagsLinkedItems.Action').t`Move the tag here to`}
        <br />
        {c('B4.Notes.TagsLinkedItems.Action').t`remove it from its folder.`}
      </p>
    </div>
  )
}

export default observer(RootTagDropZone)
