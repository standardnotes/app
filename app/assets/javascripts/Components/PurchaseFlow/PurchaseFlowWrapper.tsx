import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import PurchaseFlowView from './PurchaseFlowView'
import { PurchaseFlowWrapperProps } from './PurchaseFlowWrapperProps'

const PurchaseFlowWrapper: FunctionComponent<PurchaseFlowWrapperProps> = ({ appState, application }) => {
  if (!appState.purchaseFlow.isOpen) {
    return null
  }

  return <PurchaseFlowView appState={appState} application={application} />
}

export default observer(PurchaseFlowWrapper)
