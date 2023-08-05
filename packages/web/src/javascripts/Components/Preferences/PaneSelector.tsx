import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'
import { PreferencesSessionController } from './Controller/PreferencesSessionController'
import Backups from '@/Components/Preferences/Panes/Backups/Backups'
import Appearance from './Panes/Appearance'
import General from './Panes/General/General'
import AccountPreferences from './Panes/Account/AccountPreferences'
import Security from './Panes/Security/Security'
import Listed from './Panes/Listed/Listed'
import HelpAndFeedback from './Panes/HelpFeedback'
import { PreferencesProps } from './PreferencesProps'
import WhatsNew from './Panes/WhatsNew/WhatsNew'
import HomeServer from './Panes/HomeServer/HomeServer'
import Vaults from './Panes/Vaults/Vaults'

const PaneSelector: FunctionComponent<PreferencesProps & { menu: PreferencesSessionController }> = ({
  menu,
  application,
}) => {
  switch (menu.selectedPaneId) {
    case 'general':
      return <General application={application} extensionsLatestVersions={menu.extensionsLatestVersions} />
    case 'account':
      return <AccountPreferences application={application} />
    case 'appearance':
      return <Appearance application={application} />
    case 'home-server':
      return <HomeServer />
    case 'security':
      return <Security application={application} />
    case 'vaults':
      return <Vaults />
    case 'backups':
      return <Backups application={application} />
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
      return <General application={application} extensionsLatestVersions={menu.extensionsLatestVersions} />
  }
}

export default observer(PaneSelector)
