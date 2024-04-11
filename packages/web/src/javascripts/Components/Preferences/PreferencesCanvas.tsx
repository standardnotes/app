import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'
import { PreferencesSessionController } from './Controller/PreferencesSessionController'
import PreferencesMenuView from './PreferencesMenuView'
import PaneSelector from './PaneSelector'
import { PreferencesProps } from './PreferencesProps'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'

const PreferencesCanvas: FunctionComponent<PreferencesProps & { menu: PreferencesSessionController }> = (props) => (
  <div className="flex min-h-0 flex-grow flex-col md:flex-row md:justify-between">
    <PreferencesMenuView menu={props.menu} />
    <div
      className="min-h-0 flex-grow overflow-auto bg-[--preferences-background-color]"
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
    >
      <PaneSelector {...props} />
    </div>
  </div>
)

export default observer(PreferencesCanvas)
