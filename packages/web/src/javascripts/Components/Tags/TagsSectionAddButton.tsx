import IconButton from '@/Components/Button/IconButton'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'

type Props = {
  tags: NavigationController
  features: FeaturesController
  className?: string
}

const TagsSectionAddButton: FunctionComponent<Props> = ({ tags, className = '' }) => {
  return (
    <IconButton
      focusable={true}
      icon="add"
      title="Create a new tag"
      className={`p-0 text-neutral ${className}`}
      onClick={() => tags.createNewTemplate()}
    />
  )
}

export default observer(TagsSectionAddButton)
