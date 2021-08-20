import { RoundIconButton } from '@/components/RoundIconButton';
import { TitleBar, Title } from '@/components/TitleBar';
import { FunctionComponent } from 'preact';
import { HelpAndFeedback, Security } from './panes';
import { observer } from 'mobx-react-lite';
import { PreferencesMenu } from './preferences-menu';
import { PreferencesMenuView } from './PreferencesMenuView';
import { WebApplication } from '@/ui_models/application';
import { Extensions } from './panes/Extensions';
import { AppState } from '@/ui_models/app_state';

const PaneSelector: FunctionComponent<{
  prefs: PreferencesMenu;
}> = observer(({ prefs: menu }) => {
  switch (menu.selectedPaneId) {
    case 'general':
      return null;
    case 'account':
      return null;
    case 'appearance':
      return null;
    case 'security':
      return <Security />;
    case 'extensions':
      return <Extensions application={menu.application} />;
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

const PreferencesCanvas: FunctionComponent<{
  preferences: PreferencesMenu;
}> = observer(({ preferences: prefs }) => (
  <div className="flex flex-row flex-grow min-h-0 justify-between">
    <PreferencesMenuView menu={prefs}></PreferencesMenuView>
    <PaneSelector prefs={prefs} />
  </div>
));

const PreferencesView: FunctionComponent<{ application: WebApplication, close: () => void }> = observer(
  ({ application, close }) => {
    const prefs = new PreferencesMenu(application);

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
  // appState: { preferences: { isOpen: boolean; closePreferences: () => void } };
  appState: AppState
}

export const PreferencesViewWrapper = observer(({ appState }: PreferencesWrapperProps) => {
    if (!appState.preferences.isOpen) return null;
    return (
      <PreferencesView application={appState.application} close={() => appState.preferences.closePreferences()} />
    );
  });
