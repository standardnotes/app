import { RoundIconButton } from '@/components/RoundIconButton';
import { TitleBar, Title } from '@/components/TitleBar';
import { FunctionComponent } from 'preact';
import { PreferenceId, Preferences } from './models/preferences';
import { PreferencesMenu } from './menu';
import { HelpAndFeedback } from './panes/help-feedback';
import { observer } from 'mobx-react-lite';
import { Security } from './panes/security';

interface PreferencesViewProps {
  close: () => void;
}

const PaneSelector: FunctionComponent<{
  prefs: Preferences;
}> = observer(({ prefs }) => {
  switch (prefs.selectedPaneId) {
    case 'general':
      return null;
    case 'account':
      return null;
    case 'appearance':
      return null;
    case 'security':
      return <Security prefs={prefs} />;
    case 'listed':
      return null;
    case 'shortcuts':
      return null;
    case 'accessibility':
      return null;
    case 'get-free-month':
      return null;
    case 'help-feedback':
      return <HelpAndFeedback />;
  }
});

export const PreferencesCanvas: FunctionComponent<{
  preferences: Preferences;
}> = observer(({ preferences: prefs }) => (
  <div className="flex flex-row flex-grow min-h-0 justify-between">
    <PreferencesMenu preferences={prefs}></PreferencesMenu>
    <PaneSelector prefs={prefs} />
  </div>
));

const PreferencesView: FunctionComponent<PreferencesViewProps> = observer(
  ({ close }) => {
    const prefs = new Preferences();
    return (
      <div className="sn-full-screen flex flex-col bg-contrast z-index-preferences">
        <TitleBar className="items-center justify-between">
          {/* div is added so flex justify-between can center the title */}
          <div className="h-8 w-8" />
          <Title className="text-lg">Your preferences for Standard Notes</Title>
          <RoundIconButton
            onClick={() => {
              close();
            }}
            type="normal"
            icon="close"
          />
        </TitleBar>
        <PreferencesCanvas preferences={prefs} />
      </div>
    );
  }
);

export interface PreferencesWrapperProps {
  appState: { preferences: { isOpen: boolean; closePreferences: () => void } };
}

export const PreferencesViewWrapper: FunctionComponent<PreferencesWrapperProps> =
  observer(({ appState }) => {
    if (!appState.preferences.isOpen) return null;
    return (
      <PreferencesView close={() => appState.preferences.closePreferences()} />
    );
  });
