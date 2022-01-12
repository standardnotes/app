import { usePremiumModal } from '@/components/Premium';
import {
  FeaturesState,
  TAG_FOLDERS_FEATURE_NAME,
  TAG_FOLDERS_FEATURE_TOOLTIP,
} from '@/ui_models/app_state/features_state';
import { Tooltip } from '@reach/tooltip';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback } from 'preact/hooks';

type Props = {
  features: FeaturesState;
};

export const TagsSectionTitle: FunctionComponent<Props> = observer(
  ({ features }) => {
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
  }
);
