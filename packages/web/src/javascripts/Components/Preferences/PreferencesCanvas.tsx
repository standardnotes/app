import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'
import { PreferencesMenuController } from './PreferencesMenuController'
import PreferencesMenuView from './PreferencesMenuView'
import PaneSelector from './PaneSelector'
import { PreferencesProps } from './PreferencesProps'

const PreferencesCanvas: FunctionComponent<PreferencesProps & { menu: PreferencesMenuController }> = (props) => (
  <div className="flex min-h-0 flex-grow flex-col md:flex-row md:justify-between">
    <PreferencesMenuView menu={props.menu} />
    <div className="min-h-0 flex-grow overflow-auto bg-contrast">
      <PaneSelector {...props} />
    </div>
  </div>
)

export default observer(PreferencesCanvas)
