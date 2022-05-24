import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { PurchaseFlowView } from './PurchaseFlowView'

export type PurchaseFlowWrapperProps = {
  appState: AppState
  application: WebApplication
}

export const PurchaseFlowWrapper: FunctionComponent<PurchaseFlowWrapperProps> = observer(
  ({ appState, application }) => {
    if (!appState.purchaseFlow.isOpen) {
      return null
    }

    return <PurchaseFlowView appState={appState} application={application} />
  },
)
