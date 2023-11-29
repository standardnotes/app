import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'
import Tools from './Tools'
import Defaults from './Defaults'
import LabsPane from './Labs/Labs'
import OfflineActivation from '@/Components/Preferences/Panes/General/Offline/OfflineActivation'
import PreferencesPane from '../../PreferencesComponents/PreferencesPane'
import Persistence from './Persistence'
import SmartViews from './SmartViews/SmartViews'
import Moments from './Moments'
import NewNoteDefaults from './NewNoteDefaults'
import { useApplication } from '@/Components/ApplicationProvider'

const General: FunctionComponent = () => {
  const application = useApplication()

  return (
    <PreferencesPane>
      <Persistence application={application} />
      <Defaults application={application} />
      <NewNoteDefaults />
      <Tools application={application} />
      <SmartViews application={application} featuresController={application.featuresController} />
      <Moments application={application} />
      <LabsPane application={application} />
      <OfflineActivation />
    </PreferencesPane>
  )
}

export default observer(General)
