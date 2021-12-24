import { TagsList } from '@/components/TagsList';
import { toDirective } from '@/components/utils';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import {
  FeaturesState,
  TAG_FOLDERS_FEATURE_NAME,
  TAG_FOLDERS_FEATURE_TOOLTIP,
} from '@/ui_models/app_state/features_state';
import { Tooltip } from '@reach/tooltip';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';
import { IconButton } from '../IconButton';
import { PremiumModalProvider, usePremiumModal } from '../Premium';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const TagAddButton: FunctionComponent<{
  appState: AppState;
  features: FeaturesState;
}> = observer(({ appState, features }) => {
  const isNativeFoldersEnabled = features.enableNativeFoldersFeature;

  if (!isNativeFoldersEnabled) {
    return null;
  }

  return (
    <IconButton
      icon="add"
      title="Create a new tag"
      focusable={true}
      onClick={() => appState.createNewTag()}
    />
  );
});

const TagTitle: FunctionComponent<{
  features: FeaturesState;
}> = observer(({ features }) => {
  const isNativeFoldersEnabled = features.enableNativeFoldersFeature;
  const hasFolders = features.hasFolders;
  const modal = usePremiumModal();

  const showPremiumAlert = useCallback(() => {
    modal.activate(TAG_FOLDERS_FEATURE_NAME);
  }, [modal]);

  if (!isNativeFoldersEnabled) {
    return (
      <>
        <div className="sk-h3 title">
          <span className="sk-bold">Tags</span>
        </div>
      </>
    );
  }

  if (hasFolders) {
    return (
      <>
        <div className="sk-h3 title">
          <span className="sk-bold">Folders</span>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="sk-h3 title">
        <span className="sk-bold">Tags</span>
        <Tooltip label={TAG_FOLDERS_FEATURE_TOOLTIP}>
          <label
            className="ml-1 sk-bold color-grey-2 cursor-pointer"
            onClick={showPremiumAlert}
          >
            Folders
          </label>
        </Tooltip>
      </div>
    </>
  );
});

export const TagsSection: FunctionComponent<Props> = observer(
  ({ application, appState }) => {
    return (
      <PremiumModalProvider>
        <section>
          <div className="tags-title-section section-title-bar">
            <div className="section-title-bar-header">
              <TagTitle features={appState.features} />
              <TagAddButton appState={appState} features={appState.features} />
            </div>
          </div>
          <TagsList application={application} appState={appState} />
        </section>
      </PremiumModalProvider>
    );
  }
);

export const TagsSectionDirective = toDirective<Props>(TagsSection);
