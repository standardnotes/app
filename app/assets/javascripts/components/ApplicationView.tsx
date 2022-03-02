import { ApplicationGroup } from '@/ui_models/application_group';
import { getPlatformString } from '@/utils';
import { AppStateEvent, PanelResizedData } from '@/ui_models/app_state';
import {
  ApplicationEvent,
  Challenge,
  PermissionDialog,
  removeFromArray,
} from '@standardnotes/snjs';
import { PANEL_NAME_NOTES, PANEL_NAME_NAVIGATION } from '@/constants';
import { STRING_DEFAULT_FILE_ERROR } from '@/strings';
import { alertDialog } from '@/services/alertService';
import { WebAppEvent, WebApplication } from '@/ui_models/application';
import { PureComponent } from '@/components/Abstract/PureComponent';
import { Navigation } from '@/components/Navigation';
import { NotesView } from '@/components/NotesView';
import { NoteGroupView } from '@/components/NoteGroupView';
import { Footer } from '@/components/Footer';
import { SessionsModal } from '@/components/SessionsModal';
import { PreferencesViewWrapper } from '@/preferences/PreferencesViewWrapper';
import { ChallengeModal } from '@/components/ChallengeModal';
import { NotesContextMenu } from '@/components/NotesContextMenu';
import { PurchaseFlowWrapper } from '@/purchaseFlow/PurchaseFlowWrapper';
import { render } from 'preact';
import { PermissionsModal } from './PermissionsModal';
import { RevisionHistoryModalWrapper } from './RevisionHistoryModal/RevisionHistoryModalWrapper';
import { PremiumModalProvider } from './Premium';
import { ConfirmSignoutContainer } from './ConfirmSignoutModal';
import { TagsContextMenu } from './Tags/TagContextMenu';
import { ToastContainer } from '@standardnotes/stylekit';

type Props = {
  application: WebApplication;
  mainApplicationGroup: ApplicationGroup;
};

type State = {
  started?: boolean;
  launched?: boolean;
  needsUnlock?: boolean;
  appClass: string;
  challenges: Challenge[];
};

export class ApplicationView extends PureComponent<Props, State> {
  public readonly platformString = getPlatformString();

  constructor(props: Props) {
    super(props, props.application);
    this.state = {
      appClass: '',
      challenges: [],
    };
    this.onDragDrop = this.onDragDrop.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.addDragDropHandlers();
  }

  deinit() {
    (this.application as unknown) = undefined;
    window.removeEventListener('dragover', this.onDragOver, true);
    window.removeEventListener('drop', this.onDragDrop, true);
    (this.onDragDrop as unknown) = undefined;
    (this.onDragOver as unknown) = undefined;
    super.deinit();
  }

  componentDidMount(): void {
    super.componentDidMount();
    this.loadApplication();
  }

  async loadApplication() {
    this.application.componentManager.setDesktopManager(
      this.application.getDesktopService()
    );
    await this.application.prepareForLaunch({
      receiveChallenge: async (challenge) => {
        const challenges = this.state.challenges.slice();
        challenges.push(challenge);
        this.setState({ challenges: challenges });
      },
    });
    await this.application.launch();
  }

  public removeChallenge = async (challenge: Challenge) => {
    const challenges = this.state.challenges.slice();
    removeFromArray(challenges, challenge);
    this.setState({ challenges: challenges });
  };

  async onAppStart() {
    super.onAppStart();
    this.setState({
      started: true,
      needsUnlock: this.application.hasPasscode(),
    });

    this.application.componentManager.presentPermissionsDialog =
      this.presentPermissionsDialog;
  }

  async onAppLaunch() {
    super.onAppLaunch();
    this.setState({
      launched: true,
      needsUnlock: false,
    });
    this.handleDemoSignInFromParams();
  }

  onUpdateAvailable() {
    this.application.notifyWebEvent(WebAppEvent.NewUpdateAvailable);
  }

  /** @override */
  async onAppEvent(eventName: ApplicationEvent) {
    super.onAppEvent(eventName);
    switch (eventName) {
      case ApplicationEvent.LocalDatabaseReadError:
        alertDialog({
          text: 'Unable to load local database. Please restart the app and try again.',
        });
        break;
      case ApplicationEvent.LocalDatabaseWriteError:
        alertDialog({
          text: 'Unable to write to local database. Please restart the app and try again.',
        });
        break;
    }
  }

  /** @override */
  async onAppStateEvent(eventName: AppStateEvent, data?: unknown) {
    if (eventName === AppStateEvent.PanelResized) {
      const { panel, collapsed } = data as PanelResizedData;
      let appClass = '';
      if (panel === PANEL_NAME_NOTES && collapsed) {
        appClass += 'collapsed-notes';
      }
      if (panel === PANEL_NAME_NAVIGATION && collapsed) {
        appClass += ' collapsed-navigation';
      }
      this.setState({ appClass });
    } else if (eventName === AppStateEvent.WindowDidFocus) {
      if (!(await this.application.isLocked())) {
        this.application.sync();
      }
    }
  }

  addDragDropHandlers() {
    /**
     * Disable dragging and dropping of files (but allow text) into main SN interface.
     * both 'dragover' and 'drop' are required to prevent dropping of files.
     * This will not prevent extensions from receiving drop events.
     */
    window.addEventListener('dragover', this.onDragOver, true);
    window.addEventListener('drop', this.onDragDrop, true);
  }

  onDragOver(event: DragEvent) {
    if (event.dataTransfer?.files.length) {
      event.preventDefault();
    }
  }

  onDragDrop(event: DragEvent) {
    if (event.dataTransfer?.files.length) {
      event.preventDefault();
      void alertDialog({
        text: STRING_DEFAULT_FILE_ERROR,
      });
    }
  }

  async handleDemoSignInFromParams() {
    if (
      window.location.href.includes('demo') &&
      !this.application.hasAccount()
    ) {
      await this.application.setCustomHost(
        'https://syncing-server-demo.standardnotes.com'
      );
      this.application.signIn('demo@standardnotes.org', 'password');
    }
  }

  presentPermissionsDialog = (dialog: PermissionDialog) => {
    render(
      <PermissionsModal
        application={this.application}
        callback={dialog.callback}
        component={dialog.component}
        permissionsString={dialog.permissionsString}
      />,
      document.body.appendChild(document.createElement('div'))
    );
  };

  render() {
    if (this.application['dealloced'] === true) {
      console.error('Attempting to render dealloced application');
      return <div></div>;
    }

    const renderAppContents = !this.state.needsUnlock && this.state.launched;

    return (
      <PremiumModalProvider
        application={this.application}
        appState={this.appState}
      >
        <div className={this.platformString + ' main-ui-view sn-component'}>
          {renderAppContents && (
            <div
              id="app"
              className={this.state.appClass + ' app app-column-container'}
            >
              <Navigation application={this.application} />

              <NotesView
                application={this.application}
                appState={this.appState}
              />

              <NoteGroupView application={this.application} />
            </div>
          )}

          {renderAppContents && (
            <>
              <Footer
                application={this.application}
                applicationGroup={this.props.mainApplicationGroup}
              />

              <SessionsModal
                application={this.application}
                appState={this.appState}
              />

              <PreferencesViewWrapper
                appState={this.appState}
                application={this.application}
              />

              <RevisionHistoryModalWrapper
                application={this.application}
                appState={this.appState}
              />
            </>
          )}

          {this.state.challenges.map((challenge) => {
            return (
              <div className="sk-modal">
                <ChallengeModal
                  key={challenge.id}
                  application={this.application}
                  challenge={challenge}
                  onDismiss={this.removeChallenge}
                />
              </div>
            );
          })}

          {renderAppContents && (
            <>
              <NotesContextMenu
                application={this.application}
                appState={this.appState}
              />

              <TagsContextMenu appState={this.appState} />

              <PurchaseFlowWrapper
                application={this.application}
                appState={this.appState}
              />

              <ConfirmSignoutContainer
                appState={this.appState}
                application={this.application}
              />

              <ToastContainer />
            </>
          )}
        </div>
      </PremiumModalProvider>
    );
  }
}
