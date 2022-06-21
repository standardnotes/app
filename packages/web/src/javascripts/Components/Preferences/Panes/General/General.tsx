import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { FunctionComponent } from 'react'
import { ExtensionsLatestVersions } from '@/Components/Preferences/Panes/Extensions/ExtensionsLatestVersions'
import { observer } from 'mobx-react-lite'
import Tools from './Tools'
import Defaults from './Defaults'
import LabsPane from './Labs/Labs'
import Advanced from '@/Components/Preferences/Panes/Account/Advanced'
import PreferencesPane from '../../PreferencesComponents/PreferencesPane'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
  extensionsLatestVersions: ExtensionsLatestVersions
}

const General: FunctionComponent<Props> = ({ viewControllerManager, application, extensionsLatestVersions }) => (
  <PreferencesPane>
    <Tools application={application} />
    <Defaults application={application} />
    <LabsPane application={application} />
    <Advanced
      application={application}
      viewControllerManager={viewControllerManager}
      extensionsLatestVersions={extensionsLatestVersions}
    />
  </PreferencesPane>
)

export default observer(General)
