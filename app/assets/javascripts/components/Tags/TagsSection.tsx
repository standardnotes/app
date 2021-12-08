import { TagsList } from '@/components/TagsList';
import { toDirective } from '@/components/utils';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { FeaturesState } from '@/ui_models/app_state/features_state';
import { TagsState } from '@/ui_models/app_state/tags_state';
import { Tooltip } from '@reach/tooltip';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { Icon } from '../Icon';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const TagAddButton: FunctionComponent<{
  appState: AppState;
  features: FeaturesState;
}> = observer(({ appState, features }) => {
  const isNativeFoldersEnabled = features.enableNativeFoldersFeature;
  const hasFolders = features.hasFolders;

  if (!isNativeFoldersEnabled) {
    return null;
  }

  if (!hasFolders) {
    return (
      <Tooltip label={'A Plus or Pro plan is required to enable Tag folders.'}>
        <div title="Premium feature">
          <Icon type="premium-feature" />
        </div>
      </Tooltip>
    );
  }

  return (
    <div onClick={() => appState.createNewTag()}>
      <Icon type="add" />
    </div>
  );
});

export const TagsSection: FunctionComponent<Props> = observer(
  ({ application, appState }) => {
    return (
      <section>
        <div className="tags-title-section section-title-bar">
          <div className="section-title-bar-header">
            <div className="sk-h3 title">
              <span className="sk-bold">Tags</span>
            </div>
            <TagAddButton appState={appState} features={appState.features} />
          </div>
        </div>
        <TagsList application={application} appState={appState} />
      </section>
    );
  }
);

export const TagsSectionDirective = toDirective<Props>(TagsSection);
