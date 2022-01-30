import { ApplicationGroup } from '@/ui_models/application_group';
import { getPlatformString } from '@/utils';
import { AppStateEvent, PanelResizedData } from '@/ui_models/app_state';
import {
  ApplicationEvent,
  Challenge,
  removeFromArray,
} from '@standardnotes/snjs';
import { PANEL_NAME_NOTES, PANEL_NAME_NAVIGATION } from '@/views/constants';
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

type Props = {
  application: WebApplication;
  mainApplicationGroup: ApplicationGroup;
};

type State = {
  started?: boolean;
  launched?: boolean;
  needsUnlock?: boolean;
  appClass: string;
};

export class ApplicationView extends PureComponent<Props, State> {
  public platformString: string;
  private notesCollapsed = false;
  private navigationCollapsed = false;

  /**
   * To prevent stale state reads (setState is async),
   * challenges is a mutable array
   */
  private challenges: Challenge[] = [];

  constructor(props: Props) {
    super(props, props.application);
    this.state = {
      appClass: '',
    };
    this.platformString = getPlatformString();
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
        this.challenges.push(challenge);
      },
    });
    await this.application.launch();
  }

  public removeChallenge = async (challenge: Challenge) => {
    removeFromArray(this.challenges, challenge);
  };

  async onAppStart() {
    super.onAppStart();
    this.setState({
      started: true,
      needsUnlock: this.application.hasPasscode(),
    });
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
      if (panel === PANEL_NAME_NOTES) {
        this.notesCollapsed = collapsed;
      }
      if (panel === PANEL_NAME_NAVIGATION) {
        this.navigationCollapsed = collapsed;
      }
      let appClass = '';
      if (this.notesCollapsed) {
        appClass += 'collapsed-notes';
      }
      if (this.navigationCollapsed) {
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

  render() {
    return (
      <div className={this.platformString + ' main-ui-view sn-component'}>
        {!this.state.needsUnlock && this.state.launched && (
          <div id="app" className={this.state.appClass + ' app'}>
            <div id="navigation-container">
              <Navigation application={this.application} />
            </div>

            <div id="notes-view">
              <NotesView
                application={this.application}
                appState={this.appState}
              />
            </div>

            <div className="flex-grow">
              <NoteGroupView application={this.application} />
            </div>
          </div>
        )}

        {!this.state.needsUnlock && this.state.launched && (
          <Footer
            application={this.application}
            applicationGroup={this.props.mainApplicationGroup}
          />
        )}

        <svg data-ionicons="5.1.2" style="display: none">
          <symbol
            id="people-circle-outline"
            viewBox="0 0 512 512"
            className="ionicon"
          >
            <path d="M256 464c-114.69 0-208-93.31-208-208S141.31 48 256 48s208 93.31 208 208-93.31 208-208 208zm0-384c-97 0-176 79-176 176s79 176 176 176 176-78.95 176-176S353.05 80 256 80z" />
            <path d="M323.67 292c-17.4 0-34.21-7.72-47.34-21.73a83.76 83.76 0 01-22-51.32c-1.47-20.7 4.88-39.75 17.88-53.62S303.38 144 323.67 144c20.14 0 38.37 7.62 51.33 21.46s19.47 33 18 53.51a84 84 0 01-22 51.3C357.86 284.28 341.06 292 323.67 292zm55.81-74zM163.82 295.36c-29.76 0-55.93-27.51-58.33-61.33-1.23-17.32 4.15-33.33 15.17-45.08s26.22-18 43.15-18 32.12 6.44 43.07 18.14 16.5 27.82 15.25 45c-2.44 33.77-28.6 61.27-58.31 61.27zM420.37 355.28c-1.59-4.7-5.46-9.71-13.22-14.46-23.46-14.33-52.32-21.91-83.48-21.91-30.57 0-60.23 7.9-83.53 22.25-26.25 16.17-43.89 39.75-51 68.18-1.68 6.69-4.13 19.14-1.51 26.11a192.18 192.18 0 00232.75-80.17zM163.63 401.37c7.07-28.21 22.12-51.73 45.47-70.75a8 8 0 00-2.59-13.77c-12-3.83-25.7-5.88-42.69-5.88-23.82 0-49.11 6.45-68.14 18.17-5.4 3.33-10.7 4.61-14.78 5.75a192.84 192.84 0 0077.78 86.64l1.79-.14a102.82 102.82 0 013.16-20.02z" />
          </symbol>
        </svg>

        <SessionsModal
          application={this.application}
          appState={this.appState}
        />

        <PreferencesViewWrapper
          appState={this.appState}
          application={this.application}
        />

        {this.challenges.map((challenge) => {
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

        <NotesContextMenu
          application={this.application}
          appState={this.appState}
        />

        <PurchaseFlowWrapper
          application={this.application}
          appState={this.appState}
        />
      </div>
    );
  }
}
