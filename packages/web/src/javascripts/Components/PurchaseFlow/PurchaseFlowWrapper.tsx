import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import PurchaseFlowView from './PurchaseFlowView'
import { PurchaseFlowWrapperProps } from './PurchaseFlowWrapperProps'

const PurchaseFlowWrapper: FunctionComponent<PurchaseFlowWrapperProps> = ({ application }) => {
  if (!application.purchaseFlowController.isOpen) {
    return null
  }

  return <PurchaseFlowView application={application} />
}

export default observer(PurchaseFlowWrapper)
