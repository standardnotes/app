import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { FunctionComponent } from 'react'
import { ExtensionsLatestVersions } from '@/Components/Preferences/Panes/Extensions/ExtensionsLatestVersions'
import { observer } from 'mobx-react-lite'
import Tools from './Tools'
import Defaults from './Defaults'
import LabsPane from './Labs'
import Advanced from '@/Components/Preferences/Panes/Account/Advanced'
import PreferencesPane from '../../PreferencesComponents/PreferencesPane'

type Props = {
  appState: AppState
  application: WebApplication
  extensionsLatestVersions: ExtensionsLatestVersions
}

const General: FunctionComponent<Props> = ({ appState, application, extensionsLatestVersions }) => (
  <PreferencesPane>
    <Tools application={application} />
    <Defaults application={application} />
    <LabsPane application={application} />
    <Advanced application={application} appState={appState} extensionsLatestVersions={extensionsLatestVersions} />
  </PreferencesPane>
)

export default observer(General)
