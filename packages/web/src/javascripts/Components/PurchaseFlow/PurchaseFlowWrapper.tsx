import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import PurchaseFlowView from './PurchaseFlowView'
import { PurchaseFlowWrapperProps } from './PurchaseFlowWrapperProps'

const PurchaseFlowWrapper: FunctionComponent<PurchaseFlowWrapperProps> = ({ viewControllerManager, application }) => {
  if (!viewControllerManager.purchaseFlowController.isOpen) {
    return null
  }

  return <PurchaseFlowView viewControllerManager={viewControllerManager} application={application} />
}

export default observer(PurchaseFlowWrapper)
