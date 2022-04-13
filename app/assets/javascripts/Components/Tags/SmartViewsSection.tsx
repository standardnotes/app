import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { SmartViewsList } from './SmartViewsList'

type Props = {
  appState: AppState
}

export const SmartViewsSection: FunctionComponent<Props> = observer(({ appState }) => {
  return (
    <section>
      <SmartViewsList appState={appState} />
    </section>
  )
})
