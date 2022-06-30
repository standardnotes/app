import { observer } from 'mobx-react-lite'
import { SNTag } from '@standardnotes/snjs'
import TagContextMenuContent from './TagContextMenuContent'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { FeaturesController } from '@/Controllers/FeaturesController'

type Props = {
  navigationController: NavigationController
  featuresController: FeaturesController
}

const TagContextMenu = ({ navigationController, featuresController }: Props) => {
  const selectedTag = navigationController.selected

  if (!selectedTag || !(selectedTag instanceof SNTag)) {
    return null
  }

  return (
    <TagContextMenuContent
      navigationController={navigationController}
      isEntitledToFolders={featuresController.hasFolders}
      selectedTag={selectedTag}
    />
  )
}

export default observer(TagContextMenu)
