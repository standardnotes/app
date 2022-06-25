import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { PurchaseFlowPane } from '@/Controllers/PurchaseFlow/PurchaseFlowPane'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import CreateAccount from './Panes/CreateAccount'
import SignIn from './Panes/SignIn'
import { SNLogoFull } from '@standardnotes/icons'

type PaneSelectorProps = {
  currentPane: PurchaseFlowPane
} & PurchaseFlowViewProps

type PurchaseFlowViewProps = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
}

const PurchaseFlowPaneSelector: FunctionComponent<PaneSelectorProps> = ({
  currentPane,
  viewControllerManager,
  application,
}) => {
  switch (currentPane) {
    case PurchaseFlowPane.CreateAccount:
      return <CreateAccount viewControllerManager={viewControllerManager} application={application} />
    case PurchaseFlowPane.SignIn:
      return <SignIn viewControllerManager={viewControllerManager} application={application} />
  }
}

const PurchaseFlowView: FunctionComponent<PurchaseFlowViewProps> = ({ viewControllerManager, application }) => {
  const { currentPane } = viewControllerManager.purchaseFlowController

  return (
    <div className="flex items-center justify-center overflow-hidden h-full w-full absolute top-0 left-0 z-purchase-flow bg-passive-super-light">
      <div className="relative w-fit">
        <div className="relative p-12 xs:px-8 mb-4 bg-default border border-solid border-border rounded xs:rounded-0">
          <SNLogoFull className="mb-5" />
          <PurchaseFlowPaneSelector
            currentPane={currentPane}
            viewControllerManager={viewControllerManager}
            application={application}
          />
        </div>
        <div className="flex justify-end xs:px-4">
          <a
            className="mr-3 font-medium text-passive-1"
            href="https://standardnotes.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy
          </a>
          <a
            className="font-medium text-passive-1"
            href="https://standardnotes.com/help"
            target="_blank"
            rel="noopener noreferrer"
          >
            Help
          </a>
        </div>
      </div>
    </div>
  )
}

export default observer(PurchaseFlowView)
