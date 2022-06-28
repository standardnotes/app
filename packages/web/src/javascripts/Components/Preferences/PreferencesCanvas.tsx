import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'
import { PreferencesMenu } from './PreferencesMenu'
import PreferencesMenuView from './PreferencesMenuView'
import PaneSelector from './PaneSelector'
import { PreferencesProps } from './PreferencesProps'

const PreferencesCanvas: FunctionComponent<PreferencesProps & { menu: PreferencesMenu }> = (props) => (
  <div className="flex min-h-0 flex-grow flex-row justify-between">
    <PreferencesMenuView menu={props.menu} />
    <PaneSelector {...props} />
  </div>
)

export default observer(PreferencesCanvas)
