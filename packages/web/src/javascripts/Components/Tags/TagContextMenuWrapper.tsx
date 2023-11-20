import { observer } from 'mobx-react-lite'
import { SNTag } from '@standardnotes/snjs'
import TagContextMenu from './TagContextMenu'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { FeaturesController } from '@/Controllers/FeaturesController'

type Props = {
  navigationController: NavigationController
  featuresController: FeaturesController
}

const TagContextMenuWrapper = ({ navigationController, featuresController }: Props) => {
  const selectedTag = navigationController.contextMenuTag

  if (!selectedTag || !(selectedTag instanceof SNTag)) {
    return null
  }

  return (
    <TagContextMenu
      navigationController={navigationController}
      isEntitledToFolders={featuresController.hasFolders}
      selectedTag={selectedTag}
    />
  )
}

export default observer(TagContextMenuWrapper)
