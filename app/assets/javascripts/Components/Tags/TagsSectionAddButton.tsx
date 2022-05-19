import { IconButton } from '@/Components/Button/IconButton'
import { FeaturesState } from '@/UIModels/AppState/FeaturesState'
import { TagsState } from '@/UIModels/AppState/TagsState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'

type Props = {
  tags: TagsState
  features: FeaturesState
}

export const TagsSectionAddButton: FunctionComponent<Props> = observer(({ tags }) => {
  return (
    <IconButton
      focusable={true}
      icon="add"
      title="Create a new tag"
      className="color-neutral p-0"
      onClick={() => tags.createNewTemplate()}
    />
  )
})
