import { RoundIconButton } from '@/Components/Button/RoundIconButton'
import { TitleBar } from '@/Components/TitleBar/TitleBar'
import { Title } from '@/Components/TitleBar/Title'
import { FunctionComponent } from 'preact'
import { observer } from 'mobx-react-lite'
import { AccountPreferences, HelpAndFeedback, Listed, General, Security } from './Panes'
import { PreferencesMenu } from './PreferencesMenu'
import { PreferencesMenuView } from './PreferencesMenuView'
import { WebApplication } from '@/UIModels/Application'
import { MfaProps } from './Panes/TwoFactorAuth/MfaProps'
import { AppState } from '@/UIModels/AppState'
import { useEffect, useMemo } from 'preact/hooks'
import { Backups } from '@/Components/Preferences/Panes/Backups'
import { Appearance } from './Panes/Appearance'

interface PreferencesProps extends MfaProps {
  application: WebApplication
  appState: AppState
  closePreferences: () => void
}

const PaneSelector: FunctionComponent<PreferencesProps & { menu: PreferencesMenu }> = observer(
  ({ menu, appState, application, mfaProvider, userProvider }) => {
    switch (menu.selectedPaneId) {
      case 'general':
        return (
          <General
            appState={appState}
            application={application}
            extensionsLatestVersions={menu.extensionsLatestVersions}
          />
        )
      case 'account':
        return <AccountPreferences application={application} appState={appState} />
      case 'appearance':
        return <Appearance application={application} />
      case 'security':
        return (
          <Security
            mfaProvider={mfaProvider}
            userProvider={userProvider}
            appState={appState}
            application={application}
          />
        )
      case 'backups':
        return <Backups application={application} appState={appState} />
      case 'listed':
        return <Listed application={application} />
      case 'shortcuts':
        return null
      case 'accessibility':
        return null
      case 'get-free-month':
        return null
      case 'help-feedback':
        return <HelpAndFeedback />
      default:
        return (
          <General
            appState={appState}
            application={application}
            extensionsLatestVersions={menu.extensionsLatestVersions}
          />
        )
    }
  },
)

const PreferencesCanvas: FunctionComponent<PreferencesProps & { menu: PreferencesMenu }> = observer((props) => (
  <div className="flex flex-row flex-grow min-h-0 justify-between">
    <PreferencesMenuView menu={props.menu} />
    <PaneSelector {...props} />
  </div>
))

export const PreferencesView: FunctionComponent<PreferencesProps> = observer((props) => {
  const menu = useMemo(
    () => new PreferencesMenu(props.application, props.appState.enableUnfinishedFeatures),
    [props.appState.enableUnfinishedFeatures, props.application],
  )

  useEffect(() => {
    menu.selectPane(props.appState.preferences.currentPane)
    const removeEscKeyObserver = props.application.io.addKeyObserver({
      key: 'Escape',
      onKeyDown: (event) => {
        event.preventDefault()
        props.closePreferences()
      },
    })
    return () => {
      removeEscKeyObserver()
    }
  }, [props, menu])

  return (
    <div className="h-full w-full absolute top-left-0 flex flex-col bg-contrast z-index-preferences">
      <TitleBar className="items-center justify-between">
        {/* div is added so flex justify-between can center the title */}
        <div className="h-8 w-8" />
        <Title className="text-lg">Your preferences for Standard Notes</Title>
        <RoundIconButton
          onClick={() => {
            props.closePreferences()
          }}
          type="normal"
          icon="close"
        />
      </TitleBar>
      <PreferencesCanvas {...props} menu={menu} />
    </div>
  )
})
