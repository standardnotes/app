import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import DeallocateHandler from '../DeallocateHandler/DeallocateHandler'
import SmartViewsList from './SmartViewsList'

type Props = {
  appState: AppState
}

const SmartViewsSection: FunctionComponent<Props> = ({ appState }) => {
  return (
    <section>
      <DeallocateHandler appState={appState}>
        <SmartViewsList appState={appState} />
      </DeallocateHandler>
    </section>
  )
}

export default observer(SmartViewsSection)
