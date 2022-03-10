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

type ExperimentalFeatureItem = {
  identifier: FeatureIdentifier;
  name: string;
  description: string;
  isEnabled: boolean;
  isEntitled: boolean;
};

type Props = {
  application: WebApplication;
};

export const LabsPane: FunctionComponent<Props> = ({ application }) => {
  const [experimentalFeatures, setExperimentalFeatures] = useState<
    ExperimentalFeatureItem[]
  >([]);

  const reloadExperimentalFeatures = useCallback(() => {
    const experimentalFeatures = application.features
      .getExperimentalFeatures()
      .map((featureIdentifier) => {
        const feature = FindNativeFeature(featureIdentifier);
        return {
          identifier: featureIdentifier,
          name: feature?.name ?? featureIdentifier,
          description: feature?.description ?? '',
          isEnabled:
            application.features.isExperimentalFeatureEnabled(
              featureIdentifier
            ),
          isEntitled:
            application.features.getFeatureStatus(featureIdentifier) ===
            FeatureStatus.Entitled,
        };
      });
    setExperimentalFeatures(experimentalFeatures);
  }, [application.features]);

  useEffect(() => {
    reloadExperimentalFeatures();
  }, [reloadExperimentalFeatures]);

  const premiumModal = usePremiumModal();

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Labs</Title>
        <div>
          {experimentalFeatures.map(
            (
              { identifier, name, description, isEnabled, isEntitled },
              index: number
            ) => {
              const toggleFeature = () => {
                if (!isEntitled) {
                  premiumModal.activate(name);
                  return;
                }

                application.features.toggleExperimentalFeature(identifier);
                reloadExperimentalFeatures();
              };

              const showHorizontalSeparator =
                experimentalFeatures.length > 1 &&
                index !== experimentalFeatures.length - 1;

              return (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <Subtitle>{name}</Subtitle>
                      <Text>{description}</Text>
                    </div>
                    <Switch onChange={toggleFeature} checked={isEnabled} />
                  </div>
                  {showHorizontalSeparator && (
                    <HorizontalSeparator classes="mt-5 mb-3" />
                  )}
                </>
              );
            }
          )}
          {experimentalFeatures.length === 0 && (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Text>No experimental features available.</Text>
              </div>
            </div>
          )}
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
};
