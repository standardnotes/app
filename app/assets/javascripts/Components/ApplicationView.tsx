import { ApplicationGroup } from '@/UIModels/ApplicationGroup'
import { getPlatformString, getWindowUrlParams } from '@/Utils'
import { AppStateEvent, PanelResizedData } from '@/UIModels/AppState'
import { ApplicationEvent, Challenge, PermissionDialog, removeFromArray } from '@standardnotes/snjs'
import { PANEL_NAME_NOTES, PANEL_NAME_NAVIGATION } from '@/Constants'
import { alertDialog } from '@/Services/AlertService'
import { WebAppEvent, WebApplication } from '@/UIModels/Application'
import { PureComponent } from '@/Components/Abstract/PureComponent'
import { Navigation } from '@/Components/Navigation'
import { NotesView } from '@/Components/NotesView'
import { NoteGroupView } from '@/Components/NoteGroupView'
import { Footer } from '@/Components/Footer'
import { SessionsModal } from '@/Components/SessionsModal'
import { PreferencesViewWrapper } from '@/Components/Preferences/PreferencesViewWrapper'
import { ChallengeModal } from '@/Components/ChallengeModal/ChallengeModal'
import { NotesContextMenu } from '@/Components/NotesContextMenu'
import { PurchaseFlowWrapper } from '@/Components/PurchaseFlow/PurchaseFlowWrapper'
import { render } from 'preact'
import { PermissionsModal } from './PermissionsModal'
import { RevisionHistoryModalWrapper } from './RevisionHistoryModal/RevisionHistoryModalWrapper'
import { PremiumModalProvider } from '@/Hooks/usePremiumModal'
import { ConfirmSignoutContainer } from './ConfirmSignoutModal'
import { TagsContextMenu } from './Tags/TagContextMenu'
import { ToastContainer } from '@standardnotes/stylekit'
import { FilePreviewModalProvider } from './Files/FilePreviewModalProvider'

type Props = {
  application: WebApplication
  mainApplicationGroup: ApplicationGroup
}

type State = {
  started?: boolean
  launched?: boolean
  needsUnlock?: boolean
  appClass: string
  challenges: Challenge[]
}

export class ApplicationView extends PureComponent<Props, State> {
  public readonly platformString = getPlatformString()

  constructor(props: Props) {
    super(props, props.application)
    this.state = {
      appClass: '',
      challenges: [],
    }
  }

  override deinit() {
    ;(this.application as unknown) = undefined
    super.deinit()
  }

  override componentDidMount(): void {
    super.componentDidMount()
    this.loadApplication().catch(console.error)
  }

  async loadApplication() {
    this.application.componentManager.setDesktopManager(this.application.getDesktopService())
    await this.application.prepareForLaunch({
      receiveChallenge: async (challenge) => {
        const challenges = this.state.challenges.slice()
        challenges.push(challenge)
        this.setState({ challenges: challenges })
      },
    })
    await this.application.launch()
  }

  public removeChallenge = async (challenge: Challenge) => {
    const challenges = this.state.challenges.slice()
    removeFromArray(challenges, challenge)
    this.setState({ challenges: challenges })
  }

  override async onAppStart() {
    super.onAppStart().catch(console.error)
    this.setState({
      started: true,
      needsUnlock: this.application.hasPasscode(),
    })

    this.application.componentManager.presentPermissionsDialog = this.presentPermissionsDialog
  }

  override async onAppLaunch() {
    super.onAppLaunch().catch(console.error)
    this.setState({
      launched: true,
      needsUnlock: false,
    })
    this.handleDemoSignInFromParams().catch(console.error)
  }

  onUpdateAvailable() {
    this.application.notifyWebEvent(WebAppEvent.NewUpdateAvailable)
  }

  override async onAppEvent(eventName: ApplicationEvent) {
    super.onAppEvent(eventName)
    switch (eventName) {
      case ApplicationEvent.LocalDatabaseReadError:
        alertDialog({
          text: 'Unable to load local database. Please restart the app and try again.',
        }).catch(console.error)
        break
      case ApplicationEvent.LocalDatabaseWriteError:
        alertDialog({
          text: 'Unable to write to local database. Please restart the app and try again.',
        }).catch(console.error)
        break
    }
  }

  override async onAppStateEvent(eventName: AppStateEvent, data?: unknown) {
    if (eventName === AppStateEvent.PanelResized) {
      const { panel, collapsed } = data as PanelResizedData
      let appClass = ''
      if (panel === PANEL_NAME_NOTES && collapsed) {
        appClass += 'collapsed-notes'
      }
      if (panel === PANEL_NAME_NAVIGATION && collapsed) {
        appClass += ' collapsed-navigation'
      }
      this.setState({ appClass })
    } else if (eventName === AppStateEvent.WindowDidFocus) {
      if (!(await this.application.isLocked())) {
        this.application.sync.sync().catch(console.error)
      }
    }
  }

  async handleDemoSignInFromParams() {
    const token = getWindowUrlParams().get('demo-token')
    if (!token || this.application.hasAccount()) {
      return
    }

    await this.application.sessions.populateSessionFromDemoShareToken(token)
  }

  presentPermissionsDialog = (dialog: PermissionDialog) => {
    render(
      <PermissionsModal
        application={this.application}
        callback={dialog.callback}
        component={dialog.component}
        permissionsString={dialog.permissionsString}
      />,
      document.body.appendChild(document.createElement('div')),
    )
  }

  override render() {
    if (this.application['dealloced'] === true) {
      console.error('Attempting to render dealloced application')
      return <div></div>
    }

    const renderAppContents = !this.state.needsUnlock && this.state.launched

    return (
      <FilePreviewModalProvider application={this.application}>
        <PremiumModalProvider application={this.application} appState={this.appState}>
          <div className={this.platformString + ' main-ui-view sn-component'}>
            {renderAppContents && (
              <div id="app" className={this.state.appClass + ' app app-column-container'}>
                <Navigation application={this.application} />
                <NotesView application={this.application} appState={this.appState} />
                <NoteGroupView application={this.application} />
              </div>
            )}
            {renderAppContents && (
              <>
                <Footer
                  application={this.application}
                  applicationGroup={this.props.mainApplicationGroup}
                />
                <SessionsModal application={this.application} appState={this.appState} />
                <PreferencesViewWrapper appState={this.appState} application={this.application} />
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
              )
            })}
            {renderAppContents && (
              <>
                <NotesContextMenu application={this.application} appState={this.appState} />
                <TagsContextMenu appState={this.appState} />
                <PurchaseFlowWrapper application={this.application} appState={this.appState} />
                <ConfirmSignoutContainer appState={this.appState} application={this.application} />
                <ToastContainer />
              </>
            )}
          </div>
        </PremiumModalProvider>
      </FilePreviewModalProvider>
    )
  }
}
