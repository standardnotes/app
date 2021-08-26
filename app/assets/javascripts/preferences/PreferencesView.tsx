import { RoundIconButton } from '@/components/RoundIconButton';
import { TitleBar, Title } from '@/components/TitleBar';
import { FunctionComponent } from 'preact';
import { AccountPreferences, HelpAndFeedback, Security } from './panes';
import { observer } from 'mobx-react-lite';
import { PreferencesMenu } from './preferences-menu';
import { PreferencesMenuView } from './PreferencesMenuView';
import { WebApplication } from '@/ui_models/application';

const PaneSelector: FunctionComponent<{
  prefs: PreferencesMenu;
  application: WebApplication;
}> = observer(({ prefs: menu, application }) => {
  switch (menu.selectedPaneId) {
    case 'general':
      return null;
    case 'account':
      return <AccountPreferences application={application} />;
    case 'appearance':
      return null;
    case 'security':
      return <Security />;
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
  application: WebApplication;
}> = observer(({ preferences: prefs, application }) => (
  <div className="flex flex-row flex-grow min-h-0 justify-between">
    <PreferencesMenuView menu={prefs}></PreferencesMenuView>
    <PaneSelector prefs={prefs} application={application} />
  </div>
));

const PreferencesView: FunctionComponent<{
  close: () => void;
  application: WebApplication;
}> = observer(
  ({ close, application }) => {
    const prefs = new PreferencesMenu();

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
        <PreferencesCanvas preferences={prefs} application={application} />
      </div>
    );
  }
);

export interface PreferencesWrapperProps {
  appState: { preferences: { isOpen: boolean; closePreferences: () => void } };
  application: WebApplication;
}

export const PreferencesViewWrapper: FunctionComponent<PreferencesWrapperProps> =
  observer(({ appState, application }) => {
    if (!appState.preferences.isOpen) return null;
    return (
      <PreferencesView
        application={application}
        close={() => appState.preferences.closePreferences()}
      />
    );
  });
