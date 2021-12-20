import { PremiumModalProvider } from '@/components/Premium';
import { TagsList } from '@/components/Tags/TagsList';
import { toDirective } from '@/components/utils';
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
      <PremiumModalProvider>
        <section>
          <div className="tags-title-section section-title-bar">
            <div className="section-title-bar-header">
              <TagsSectionTitle features={appState.features} />
              <TagsSectionAddButton
                appState={appState}
                features={appState.features}
              />
            </div>
          </div>
          <TagsList appState={appState} />
        </section>
      </PremiumModalProvider>
    );
  }
);

export const TagsSectionDirective = toDirective<Props>(TagsSection);
