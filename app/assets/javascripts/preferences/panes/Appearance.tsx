import { Dropdown, DropdownItem } from '@/components/Dropdown';
import { PremiumModalProvider, usePremiumModal } from '@/components/Premium';
import { sortThemes } from '@/components/QuickSettingsMenu/QuickSettingsMenu';
import { HorizontalSeparator } from '@/components/shared/HorizontalSeparator';
import { Switch } from '@/components/Switch';
import { WebApplication } from '@/ui_models/application';
import { Features } from '@standardnotes/features';
import {
  ContentType,
  FeatureIdentifier,
  FeatureStatus,
  PrefKey,
  SNTheme,
} from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  PreferencesGroup,
  PreferencesPane,
  PreferencesSegment,
  Subtitle,
  Title,
  Text,
} from '../components';

export const MIDNIGHT_THEME_IDENTIFIER =
  'org.standardnotes.theme-midnight' as FeatureIdentifier;

type Props = {
  application: WebApplication;
};

const _Appearance: FunctionComponent<Props> = observer(({ application }) => {
  const premiumModal = usePremiumModal();
  const isEntitledToMidnightTheme =
    application.getFeatureStatus(MIDNIGHT_THEME_IDENTIFIER) ===
    FeatureStatus.Entitled;

  const [themeItems, setThemeItems] = useState<DropdownItem[]>([]);
  const [autoLightTheme, setAutoLightTheme] = useState<string>(
    () =>
      application.getPreference(
        PrefKey.AutoLightThemeIdentifier,
        'None'
      ) as string
  );
  const [autoDarkTheme, setAutoDarkTheme] = useState<string>(
    () =>
      application.getPreference(
        PrefKey.AutoDarkThemeIdentifier,
        isEntitledToMidnightTheme ? MIDNIGHT_THEME_IDENTIFIER : 'None'
      ) as string
  );
  const [useDeviceSettings, setUseDeviceSettings] = useState(
    () =>
      application.getPreference(PrefKey.UseSystemColorScheme, false) as boolean
  );

  useEffect(() => {
    const themesAsItems: DropdownItem[] = (
      application.getDisplayableItems(ContentType.Theme) as SNTheme[]
    )
      .filter((theme) => !theme.isLayerable())
      .sort(sortThemes)
      .map((theme) => {
        return {
          label: theme.name,
          value: theme.package_info.identifier as string,
        };
      });

    Features.filter(
      (feature) =>
        feature.content_type === ContentType.Theme && !feature.layerable
    ).forEach((theme) => {
      if (
        themesAsItems.findIndex((item) => item.value === theme.identifier) ===
        -1
      ) {
        themesAsItems.push({
          label: theme.name as string,
          value: theme.identifier,
          icon: 'premium-feature',
        });
      }
    });

    themesAsItems.unshift(
      {
        label: 'None',
        value: 'None',
      },
      {
        label: 'Default',
        value: 'Default',
      }
    );

    setThemeItems(themesAsItems);
  }, [application]);

  const toggleUseDeviceSettings = () => {
    application.setPreference(PrefKey.UseSystemColorScheme, !useDeviceSettings);
    if (!application.getPreference(PrefKey.AutoLightThemeIdentifier)) {
      application.setPreference(
        PrefKey.AutoLightThemeIdentifier,
        autoLightTheme as FeatureIdentifier
      );
    }
    if (!application.getPreference(PrefKey.AutoDarkThemeIdentifier)) {
      application.setPreference(
        PrefKey.AutoDarkThemeIdentifier,
        autoDarkTheme as FeatureIdentifier
      );
    }
    setUseDeviceSettings(!useDeviceSettings);
  };

  const changeAutoLightTheme = (value: string, item: DropdownItem) => {
    if (item.icon === 'premium-feature') {
      premiumModal.activate(`${item.label} theme`);
    } else {
      application.setPreference(
        PrefKey.AutoLightThemeIdentifier,
        value as FeatureIdentifier
      );
      setAutoLightTheme(value);
    }
  };

  const changeAutoDarkTheme = (value: string, item: DropdownItem) => {
    if (item.icon === 'premium-feature') {
      premiumModal.activate(`${item.label} theme`);
    } else {
      application.setPreference(
        PrefKey.AutoDarkThemeIdentifier,
        value as FeatureIdentifier
      );
      setAutoDarkTheme(value);
    }
  };

  return (
    <PreferencesPane>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Themes</Title>
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Subtitle>Use device settings</Subtitle>
                <Text>
                  Automatically set the selected light / dark theme based on
                  your device’s settings.
                </Text>
              </div>
              <Switch
                onChange={toggleUseDeviceSettings}
                checked={useDeviceSettings}
              />
            </div>
            <HorizontalSeparator classes="mt-5 mb-3" />
            <div>
              <Subtitle>Automatic Light Theme</Subtitle>
              <Text>Theme to be used for system light mode:</Text>
              <div className="mt-2">
                <Dropdown
                  id="auto-light-theme-dropdown"
                  label="Select the automatic light theme"
                  items={themeItems}
                  value={autoLightTheme}
                  onChange={changeAutoLightTheme}
                  disabled={!useDeviceSettings}
                />
              </div>
            </div>
            <HorizontalSeparator classes="mt-5 mb-3" />
            <div>
              <Subtitle>Automatic Dark Theme</Subtitle>
              <Text>Theme to be used for system dark mode:</Text>
              <div className="mt-2">
                <Dropdown
                  id="auto-dark-theme-dropdown"
                  label="Select the automatic dark theme"
                  items={themeItems}
                  value={autoDarkTheme}
                  onChange={changeAutoDarkTheme}
                  disabled={!useDeviceSettings}
                />
              </div>
            </div>
          </div>
        </PreferencesSegment>
      </PreferencesGroup>
    </PreferencesPane>
  );
});

export const Appearance: FunctionComponent<Props> = observer(
  ({ application }) => (
    <PremiumModalProvider state={application.getAppState().features}>
      <_Appearance application={application} />
    </PremiumModalProvider>
  )
);
