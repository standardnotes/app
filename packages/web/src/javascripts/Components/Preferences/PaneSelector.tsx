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
import PluginsPane from './Panes/Plugins/PluginsPane'
import { PreferencePaneId } from '@standardnotes/snjs'

const PaneSelector: FunctionComponent<PreferencesProps & { menu: PreferencesSessionController }> = ({
  menu,
  application,
}) => {
  switch (menu.selectedPaneId) {
    case PreferencePaneId.General:
      return <General />
    case PreferencePaneId.Account:
      return <AccountPreferences application={application} />
    case PreferencePaneId.Appearance:
      return <Appearance application={application} />
    case PreferencePaneId.HomeServer:
      return <HomeServer />
    case PreferencePaneId.Security:
      return <Security application={application} />
    case PreferencePaneId.Vaults:
      return <Vaults />
    case PreferencePaneId.Backups:
      return <Backups application={application} />
    case PreferencePaneId.Listed:
      return <Listed application={application} />
    case PreferencePaneId.Shortcuts:
      return null
    case PreferencePaneId.Plugins:
      return <PluginsPane pluginsLatestVersions={menu.extensionsLatestVersions} />
    case PreferencePaneId.Accessibility:
      return null
    case PreferencePaneId.GetFreeMonth:
      return null
    case PreferencePaneId.HelpFeedback:
      return <HelpAndFeedback application={application} />
    case PreferencePaneId.WhatsNew:
      return <WhatsNew application={application} />
    default:
      return <General />
  }
}

export default observer(PaneSelector)
