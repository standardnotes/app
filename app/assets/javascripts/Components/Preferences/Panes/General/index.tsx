import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { FunctionComponent } from 'preact'
import { PreferencesPane } from '@/Components/Preferences/PreferencesComponents'
import { ExtensionsLatestVersions } from '@/Components/Preferences/Panes/Extensions/ExtensionsLatestVersions'
import { observer } from 'mobx-react-lite'
import { Tools } from './Tools'
import { Defaults } from './Defaults'
import { LabsPane } from './Labs'
import { Advanced } from '@/Components/Preferences/Panes/Account/Advanced'

interface GeneralProps {
  appState: AppState
  application: WebApplication
  extensionsLatestVersions: ExtensionsLatestVersions
}

export const General: FunctionComponent<GeneralProps> = observer(
  ({ appState, application, extensionsLatestVersions }) => (
    <PreferencesPane>
      <Tools application={application} />
      <Defaults application={application} />
      <LabsPane application={application} />
      <Advanced application={application} appState={appState} extensionsLatestVersions={extensionsLatestVersions} />
    </PreferencesPane>
  ),
)
