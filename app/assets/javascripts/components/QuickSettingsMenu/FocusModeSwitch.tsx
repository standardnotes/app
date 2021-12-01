import { WebApplication } from '@/ui_models/application';
import { FeatureIdentifier } from '@standardnotes/features';
import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Icon } from '../Icon';
import { PremiumFeaturesModal } from '../PremiumFeaturesModal';
import { Switch } from '../Switch';

type Props = {
  application: WebApplication;
  focusModeEnabled: boolean;
  setFocusModeEnabled: (enabled: boolean) => void;
};

export const FocusModeSwitch: FunctionComponent<Props> = ({
  application,
  focusModeEnabled,
  setFocusModeEnabled,
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isEntitledToFocusMode =
    application.getFeatureStatus(FeatureIdentifier.FocusMode) === 'Entitled';

  const toggleFocusMode = () => {
    if (isEntitledToFocusMode) {
      setFocusModeEnabled(!focusModeEnabled);
    } else {
      setShowUpgradeModal(true);
    }
  };

  return (
    <>
      <button
        className="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none justify-between"
        onClick={toggleFocusMode}
      >
        <div className="flex items-center">
          <Icon type="menu-close" className="color-neutral mr-2" />
          Focused Writing
        </div>
        {isEntitledToFocusMode ? (
          <Switch className="px-0" checked={focusModeEnabled} />
        ) : (
          <div title="Premium feature">
            <Icon type="premium-feature" />
          </div>
        )}
      </button>
      <PremiumFeaturesModal
        showModal={showUpgradeModal}
        featureName="Focus Mode"
        onClose={() => setShowUpgradeModal(false)}
        application={application}
      />
    </>
  );
};
