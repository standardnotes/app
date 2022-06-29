import IconButton from '@/Components/Button/IconButton'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'

type Props = {
  tags: NavigationController
  features: FeaturesController
}

const TagsSectionAddButton: FunctionComponent<Props> = ({ tags }) => {
  return (
    <IconButton
      focusable={true}
      icon="add"
      title="Create a new tag"
      className="p-0 text-neutral"
      onClick={() => tags.createNewTemplate()}
    />
  )
}

export default observer(TagsSectionAddButton)
