import { RoundIconButton } from '@/components/RoundIconButton';
import { TitleBar, Title } from '@/components/TitleBar';
import { FunctionComponent } from 'preact';
import { AccountPreferences, General, HelpAndFeedback, Security } from './panes';
import { observer } from 'mobx-react-lite';
import { PreferencesMenu } from './PreferencesMenu';
import { PreferencesMenuView } from './PreferencesMenuView';
import { WebApplication } from '@/ui_models/application';
import { MfaProps } from './panes/two-factor-auth/MfaProps';
import { AppState } from '@/ui_models/app_state';
import { useEffect } from 'preact/hooks';
import { PurchaseIframe } from './PurchaseIframe';

interface PreferencesProps extends MfaProps {
  application: WebApplication;
  appState: AppState;
  closePreferences: () => void;
}

const PaneSelector: FunctionComponent<
  PreferencesProps & { menu: PreferencesMenu }
> = observer((props) => {
  switch (props.menu.selectedPaneId) {
    case 'general':
      return <General appState={props.appState} application={props.application} />
    case 'account':
      return (
        <AccountPreferences
          application={props.application}
          appState={props.appState}
        />
      );
    case 'appearance':
      return null;
    case 'security':
      return (
        <Security
          mfaProvider={props.mfaProvider}
          userProvider={props.userProvider}
          appState={props.appState}
          application={props.application}
        />
      );
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

const PreferencesCanvas: FunctionComponent<
  PreferencesProps & { menu: PreferencesMenu }
> = observer((props) => (
  <div className="flex flex-row flex-grow min-h-0 justify-between">
    <PreferencesMenuView menu={props.menu} />
    <PaneSelector {...props} />
  </div>
));

export const PreferencesView: FunctionComponent<PreferencesProps> = observer(
  (props) => {
    const { application, appState, closePreferences } = props;
    const { isPurchaseIframeOpen } = appState.preferences;
    const menu = new PreferencesMenu();

    useEffect(() => {
      const removeEscKeyObserver = application.io.addKeyObserver({
        key: 'Escape',
        onKeyDown: (event) => {
          event.preventDefault();
          closePreferences();
        }
      });
      return () => {
        removeEscKeyObserver();
      };
    }, [application, closePreferences]);

    return (
      <div className="h-full w-full absolute top-left-0 flex flex-col bg-contrast z-index-preferences">
        <TitleBar className="items-center justify-between">
          <Title className="text-lg ml-8 text-center w-full">Your preferences for Standard Notes</Title>
          <RoundIconButton
            onClick={() => {
              isPurchaseIframeOpen ? appState.preferences.closePurchaseIframe() : closePreferences();
            }}
            type="normal"
            icon="close"
          />
        </TitleBar>
        {isPurchaseIframeOpen ? (
          <PurchaseIframe application={props.application} />
        ) : (
          <PreferencesCanvas {...props} menu={menu} />
        )}
      </div>
    );
  }
);
