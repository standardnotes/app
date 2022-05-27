import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import SmartViewsList from './SmartViewsList'

type Props = {
  appState: AppState
}

const SmartViewsSection: FunctionComponent<Props> = ({ appState }) => {
  return (
    <section>
      <SmartViewsList appState={appState} />
    </section>
  )
}

export default observer(SmartViewsSection)
