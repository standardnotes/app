import { WebApplication } from '@/ui_models/application';
import { FeatureIdentifier } from '@standardnotes/features';
import { FeatureStatus } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import { Icon } from '../Icon';
import { PremiumFeaturesModal } from '../PremiumFeaturesModal';
import { Switch } from '../Switch';

type Props = {
  application: WebApplication;
  onToggle: (value: boolean) => void;
  onClose: () => void;
  isEnabled: boolean;
};

export const FocusModeSwitch: FunctionComponent<Props> = ({
  application,
  onToggle,
  onClose,
  isEnabled,
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isEntitled =
    application.getFeatureStatus(FeatureIdentifier.FocusMode) ===
    FeatureStatus.Entitled;

  const toggle = useCallback(
    (e: JSXInternal.TargetedMouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      if (isEntitled) {
        onToggle(!isEnabled);
        onClose();
      } else {
        setShowUpgradeModal(true);
      }
    },
    [isEntitled, isEnabled, onToggle, setShowUpgradeModal, onClose]
  );

  return (
    <>
      <button
        className="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none justify-between"
        onClick={toggle}
      >
        <div className="flex items-center">
          <Icon type="menu-close" className="color-neutral mr-2" />
          Focused Writing
        </div>
        {isEntitled ? (
          <Switch className="px-0" checked={isEnabled} />
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
      />
    </>
  );
};
