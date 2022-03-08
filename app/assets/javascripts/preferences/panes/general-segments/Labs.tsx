import { FindNativeFeature } from '@standardnotes/features';
import { Switch } from '@/components/Switch';
import {
  PreferencesGroup,
  PreferencesSegment,
  Subtitle,
  Text,
  Title,
} from '@/preferences/components';
import { WebApplication } from '@/ui_models/application';
import { FeatureIdentifier, FeatureStatus } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { usePremiumModal } from '@/components/Premium';
import { HorizontalSeparator } from '@/components/shared/HorizontalSeparator';

type Props = {
  application: WebApplication;
};

export const LabsPane: FunctionComponent<Props> = ({ application }) => {
  const [experimentalFeatures, setExperimentalFeatures] =
    useState<FeatureIdentifier[]>();

  const reloadExperimentalFeatures = useCallback(() => {
    const experimentalFeatures = application.features.getExperimentalFeatures();
    setExperimentalFeatures(experimentalFeatures);
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
        <div>
          {experimentalFeatures?.map(
            (featureIdentifier: FeatureIdentifier, index: number) => {
              const feature = FindNativeFeature(featureIdentifier);
              const featureName = feature?.name ?? featureIdentifier;
              const featureDescription = feature?.description ?? '';

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

                application.features.toggleExperimentalFeature(
                  featureIdentifier
                );
                reloadExperimentalFeatures();
              };

              const showHorizontalSeparator =
                experimentalFeatures.length > 1 &&
                index !== experimentalFeatures.length - 1;

              return (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <Subtitle>{featureName}</Subtitle>
                      <Text>{featureDescription}</Text>
                    </div>
                    <Switch
                      onChange={toggleFeature}
                      checked={isFeatureEnabled}
                    />
                  </div>
                  {showHorizontalSeparator && (
                    <HorizontalSeparator classes="mt-5 mb-3" />
                  )}
                </>
              );
            }
          )}
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
};
