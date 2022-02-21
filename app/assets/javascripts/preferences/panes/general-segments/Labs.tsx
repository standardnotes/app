import { Switch } from '@/components/Switch';
import {
  PreferencesGroup,
  PreferencesSegment,
  Title,
} from '@/preferences/components';
import { WebApplication } from '@/ui_models/application';
import { FeatureIdentifier } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

type Props = {
  application: WebApplication;
};

/** @TODO Remove after adding in snjs */
const storageKey = 'enabled_lab_features';

export const LabsPane: FunctionComponent<Props> = ({ application }) => {
  const [enabledLabFeatures, setEnabledLabFeatures] =
    useState<FeatureIdentifier[]>();

  const reloadEnabledFeatures = useCallback(async () => {
    const rawStorageValue =
      await application.deviceInterface.getRawStorageValue(storageKey);
    if (rawStorageValue) {
      const parsedEnabledLabFeatures: FeatureIdentifier[] =
        JSON.parse(rawStorageValue);
      setEnabledLabFeatures(parsedEnabledLabFeatures);
    }
  }, [application.deviceInterface]);

  useEffect(() => {
    reloadEnabledFeatures();
  }, [reloadEnabledFeatures]);

  const isAccountSwitcherEnabled = useMemo(() => {
    return enabledLabFeatures?.includes(FeatureIdentifier.AccountSwitcher);
  }, [enabledLabFeatures]);

  const toggleAccountSwitcher = () => {
    const currentFeatures = enabledLabFeatures ? enabledLabFeatures : [];

    if (isAccountSwitcherEnabled) {
      application.deviceInterface.setRawStorageValue(
        storageKey,
        JSON.stringify(
          currentFeatures.filter(
            (feature) => feature !== FeatureIdentifier.AccountSwitcher
          )
        )
      );
    } else {
      application.deviceInterface.setRawStorageValue(
        storageKey,
        JSON.stringify([...currentFeatures, FeatureIdentifier.AccountSwitcher])
      );
    }

    reloadEnabledFeatures();
  };

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Labs</Title>
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm m-0">Account Switcher</div>
          <Switch
            onChange={toggleAccountSwitcher}
            checked={isAccountSwitcherEnabled}
          />
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
};
