import Icon from '@/Components/Icon/Icon'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'

type Props = {
  tagsState: NavigationController
  featuresState: FeaturesController
}

const RootTagDropZone: FunctionComponent<Props> = () => {
  return (
    <div className="root-drop">
      <Icon className="text-neutral" type="link-off" />
      <p className="content">
        Move the tag here to <br />
        remove it from its folder.
      </p>
    </div>
  )
}

export default observer(RootTagDropZone)
