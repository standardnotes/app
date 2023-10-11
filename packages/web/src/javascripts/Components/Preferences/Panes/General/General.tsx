import { WebApplication } from '@/Application/WebApplication'
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
import NewNoteDefaults from './NewNoteDefaults'

type Props = {
  application: WebApplication
  extensionsLatestVersions: PackageProvider
}

const General: FunctionComponent<Props> = ({ application, extensionsLatestVersions }) => (
  <PreferencesPane>
    <Persistence application={application} />
    <Defaults application={application} />
    <NewNoteDefaults />
    <Tools application={application} />
    <SmartViews application={application} featuresController={application.featuresController} />
    <Moments application={application} />
    <LabsPane application={application} />
    <Advanced application={application} extensionsLatestVersions={extensionsLatestVersions} />
  </PreferencesPane>
)

export default observer(General)
