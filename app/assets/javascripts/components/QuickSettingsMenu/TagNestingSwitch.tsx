import { WebApplication } from '@/ui_models/application';
import { FeatureIdentifier } from '@standardnotes/features';
import { FeatureStatus } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import { Icon } from '../Icon';
import { PremiumFeaturesModal } from '../PremiumFeaturesModal';
import { Switch } from '../Switch';

type Props = {
  application: WebApplication;
  closeQuickSettingsMenu: () => void;
  // focusModeEnabled: boolean;
  // setFocusModeEnabled: (enabled: boolean) => void;
};

export const TagNestingSwitch: FunctionComponent<Props> = ({
  application,
  closeQuickSettingsMenu,
  // hasTagNesting,
  // setFocusModeEnabled,
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isEntitled =
    application.getFeatureStatus(FeatureIdentifier.TagNesting) ===
    FeatureStatus.Entitled;
  const isEnabled = application.getAppState().tags.hasFolders;

  const toggle = (e: JSXInternal.TargetedMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (isEntitled) {
      application.getAppState().tags.hasFolders = true;
      closeQuickSettingsMenu();
    } else {
      setShowUpgradeModal(true);
    }
  };

  return (
    <>
      <button
        className="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none justify-between"
        onClick={toggle}
      >
        <div className="flex items-center">
          <Icon type="list-bulleted" className="color-neutral mr-2" />
          Tag Nesting
        </div>
        {isEntitled ? (
          <Switch className="px-0" checked={isEnabled} disabled={true} />
        ) : (
          <div title="Premium feature">
            <Icon type="premium-feature" />
          </div>
        )}
      </button>
      <PremiumFeaturesModal
        showModal={showUpgradeModal}
        featureName="Tag Nesting"
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
};
