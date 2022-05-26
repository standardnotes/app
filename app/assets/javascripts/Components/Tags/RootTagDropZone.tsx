import Icon from '@/Components/Icon/Icon'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { FeaturesState } from '@/UIModels/AppState/FeaturesState'
import { TagsState } from '@/UIModels/AppState/TagsState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { useDrop } from 'react-dnd'
import { DropItem, DropProps, ItemTypes } from './DragNDrop'

type Props = {
  tagsState: TagsState
  featuresState: FeaturesState
}

const RootTagDropZone: FunctionComponent<Props> = ({ tagsState }) => {
  const premiumModal = usePremiumModal()

  const [{ isOver, canDrop }, dropRef] = useDrop<DropItem, void, DropProps>(
    () => ({
      accept: ItemTypes.TAG,
      canDrop: (item) => {
        return tagsState.hasParent(item.uuid)
      },
      drop: (item) => {
        tagsState.assignParent(item.uuid, undefined).catch(console.error)
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [tagsState, premiumModal],
  )

  return (
    <div ref={dropRef} className={`root-drop ${canDrop ? 'active' : ''} ${isOver ? 'is-drag-over' : ''}`}>
      <Icon className="color-neutral" type="link-off" />
      <p className="content">
        Move the tag here to <br />
        remove it from its folder.
      </p>
    </div>
  )
}

export default observer(RootTagDropZone)
