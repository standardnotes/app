import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'
import { PreferencesMenu } from './PreferencesMenu'
import Backups from '@/Components/Preferences/Panes/Backups/Backups'
import Appearance from './Panes/Appearance'
import General from './Panes/General/General'
import AccountPreferences from './Panes/Account/AccountPreferences'
import Security from './Panes/Security/Security'
import Listed from './Panes/Listed/Listed'
import HelpAndFeedback from './Panes/HelpFeedback'
import { PreferencesProps } from './PreferencesProps'
import WhatsNew from './Panes/WhatsNew'

const PaneSelector: FunctionComponent<PreferencesProps & { menu: PreferencesMenu }> = ({
  menu,
  viewControllerManager,
  application,
  mfaProvider,
  userProvider,
}) => {
  switch (menu.selectedPaneId) {
    case 'general':
      return (
        <General
          viewControllerManager={viewControllerManager}
          application={application}
          extensionsLatestVersions={menu.extensionsLatestVersions}
        />
      )
    case 'account':
      return <AccountPreferences application={application} viewControllerManager={viewControllerManager} />
    case 'appearance':
      return <Appearance application={application} />
    case 'security':
      return (
        <Security
          mfaProvider={mfaProvider}
          userProvider={userProvider}
          viewControllerManager={viewControllerManager}
          application={application}
        />
      )
    case 'backups':
      return <Backups application={application} viewControllerManager={viewControllerManager} />
    case 'listed':
      return <Listed application={application} />
    case 'shortcuts':
      return null
    case 'accessibility':
      return null
    case 'get-free-month':
      return null
    case 'help-feedback':
      return <HelpAndFeedback application={application} />
    case 'whats-new':
      return <WhatsNew application={application} />
    default:
      return (
        <General
          viewControllerManager={viewControllerManager}
          application={application}
          extensionsLatestVersions={menu.extensionsLatestVersions}
        />
      )
  }
}

export default observer(PaneSelector)
