import { WebApplication } from '@/UIModels/Application'
import { isStateDealloced } from '@/UIModels/AppState/AbstractState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'

type Props = {
  application: WebApplication
}

const DeallocateHandler: FunctionComponent<Props> = ({ application, children }) => {
  const appState = application.getAppState()

  if (application.dealloced || isStateDealloced(appState)) {
    return null
  }

  return <>{children}</>
}

export default observer(DeallocateHandler)
