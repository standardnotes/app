import { TagsList } from '@/components/Tags/TagsList';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { TagsSectionAddButton } from './TagsSectionAddButton';
import { TagsSectionTitle } from './TagsSectionTitle';

type Props = {
  appState: AppState;
};

export const TagsSection: FunctionComponent<Props> = observer(
  ({ appState }) => {
    return (
      <section>
        <div className="tags-title-section section-title-bar">
          <div className="section-title-bar-header">
            <TagsSectionTitle features={appState.features} />
            <TagsSectionAddButton
              tags={appState.tags}
              features={appState.features}
            />
          </div>
        </div>
        <TagsList appState={appState} />
      </section>
    );
  }
);
