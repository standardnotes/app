import { WebApplication } from '@/Application/WebApplication'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { FunctionComponent } from 'react'
import { PackageProvider } from '@/Components/Preferences/Panes/General/Advanced/Packages/Provider/PackageProvider'
import { observer } from 'mobx-react-lite'
import Tools from './Tools'
import Defaults from './Defaults'
import LabsPane from './Labs/Labs'
import Advanced from '@/Components/Preferences/Panes/General/Advanced/AdvancedSection'
import PreferencesPane from '../../PreferencesComponents/PreferencesPane'
import Persistence from './Persistence'
import SmartViews from './SmartViews/SmartViews'
import Moments from './Moments'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
  extensionsLatestVersions: PackageProvider
}

const General: FunctionComponent<Props> = ({ viewControllerManager, application, extensionsLatestVersions }) => (
  <PreferencesPane>
    <Persistence application={application} />
    <Defaults application={application} />
    <Tools application={application} />
    <SmartViews application={application} featuresController={viewControllerManager.featuresController} />
    <Moments application={application} />
    <LabsPane application={application} />
    <Advanced
      application={application}
      viewControllerManager={viewControllerManager}
      extensionsLatestVersions={extensionsLatestVersions}
    />
  </PreferencesPane>
)

export default observer(General)
