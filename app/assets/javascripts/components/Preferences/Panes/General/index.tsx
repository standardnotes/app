import { WebApplication } from '@/ui_models/application'
import { AppState } from '@/ui_models/app_state'
import { FunctionComponent } from 'preact'
import { PreferencesPane } from '../../Components'
import { ExtensionsLatestVersions } from '@/components/Preferences/Panes/Extensions/ExtensionsLatestVersions'
import { observer } from 'mobx-react-lite'
import { Tools } from './Tools'
import { Defaults } from './Defaults'
import { LabsPane } from './Labs'
import { Advanced } from '../Account/Advanced'

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
      <Advanced
        application={application}
        appState={appState}
        extensionsLatestVersions={extensionsLatestVersions}
      />
    </PreferencesPane>
  ),
)
