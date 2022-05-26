import { AppState } from '@/UIModels/AppState'
import { isStateDealloced } from '@/UIModels/AppState/AbstractState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'

type Props = {
  appState: AppState
}

const DeallocateHandler: FunctionComponent<Props> = ({ appState, children }) => {
  if (isStateDealloced(appState)) {
    return null
  }

  return <>{children}</>
}

export default observer(DeallocateHandler)
