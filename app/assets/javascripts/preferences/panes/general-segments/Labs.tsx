import { FindNativeFeature } from '@standardnotes/features';
import { Switch } from '@/components/Switch';
import {
  PreferencesGroup,
  PreferencesSegment,
  Title,
} from '@/preferences/components';
import { WebApplication } from '@/ui_models/application';
import { FeatureIdentifier, FeatureStatus } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { usePremiumModal } from '@/components/Premium';

type Props = {
  application: WebApplication;
};

export const LabsPane: FunctionComponent<Props> = ({ application }) => {
  const [experimentalFeatures, setExperimentalFeatures] =
    useState<FeatureIdentifier[]>();

  const reloadExperimentalFeatures = useCallback(() => {
    const experimentalFeatures = application.features.getExperimentalFeatures();

    setExperimentalFeatures(
      experimentalFeatures.filter(
        (feature) => feature !== FeatureIdentifier.AccountSwitcher
      )
    );
  }, [application.features]);

  useEffect(() => {
    reloadExperimentalFeatures();
  }, [reloadExperimentalFeatures]);

  const premiumModal = usePremiumModal();

  if (!experimentalFeatures) {
    return (
      <div className="flex items-center justify-between">
        No experimental features available.
      </div>
    );
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Labs</Title>
        {experimentalFeatures?.map((featureIdentifier: FeatureIdentifier) => {
          const featureName =
            FindNativeFeature(featureIdentifier)?.name ?? featureIdentifier;
          const isFeatureEnabled =
            application.features.isExperimentalFeatureEnabled(
              featureIdentifier
            );

          const toggleFeature = () => {
            const isEntitled =
              application.features.getFeatureStatus(featureIdentifier) ===
              FeatureStatus.Entitled;
            if (!isEntitled) {
              premiumModal.activate(featureName);
              return;
            }

            application.features.toggleExperimentalFeature(featureIdentifier);
            reloadExperimentalFeatures();
          };

          return (
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm m-0">{featureName}</div>
              <Switch onChange={toggleFeature} checked={isFeatureEnabled} />
            </div>
          );
        })}
      </PreferencesSegment>
    </PreferencesGroup>
  );
};
