import { IconButton } from '@/components/IconButton';
import { FeaturesState } from '@/ui_models/app_state/features_state';
import { TagsState } from '@/ui_models/app_state/tags_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';

type Props = {
  tags: TagsState;
  features: FeaturesState;
};

export const TagsSectionAddButton: FunctionComponent<Props> = observer(
  ({ tags }) => {
    return (
      <IconButton
        focusable={true}
        icon="add"
        title="Create a new tag"
        className="color-neutral"
        onClick={() => tags.createNewTemplate()}
      />
    );
  }
);
