import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { SmartTagsListItem } from './SmartTagsListItem';

type Props = {
  appState: AppState;
};

export const SmartTagsList: FunctionComponent<Props> = observer(
  ({ appState }) => {
    const allTags = appState.tags.smartTags;

    return (
      <>
        {allTags.map((tag) => {
          return (
            <SmartTagsListItem
              key={tag.uuid}
              tag={tag}
              tagsState={appState.tags}
              features={appState.features}
            />
          );
        })}
      </>
    );
  }
);
