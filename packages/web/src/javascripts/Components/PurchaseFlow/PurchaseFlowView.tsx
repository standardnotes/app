import { WebApplication } from '@/Application/WebApplication'
import { PurchaseFlowPane } from '@/Controllers/PurchaseFlow/PurchaseFlowPane'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import CreateAccount from './Panes/CreateAccount'
import SignIn from './Panes/SignIn'
import { SNLogoFull } from '@standardnotes/icons'
import Icon from '../Icon/Icon'

type PaneSelectorProps = {
  currentPane: PurchaseFlowPane
} & PurchaseFlowViewProps

type PurchaseFlowViewProps = {
  application: WebApplication
}

const PurchaseFlowPaneSelector: FunctionComponent<PaneSelectorProps> = ({ currentPane, application }) => {
  switch (currentPane) {
    case PurchaseFlowPane.CreateAccount:
      return <CreateAccount application={application} />
    case PurchaseFlowPane.SignIn:
      return <SignIn application={application} />
  }
}

const PurchaseFlowView: FunctionComponent<PurchaseFlowViewProps> = ({ application }) => {
  const { currentPane } = application.purchaseFlowController

  return (
    <div className="absolute left-0 top-0 z-purchase-flow flex h-full w-full items-center justify-center overflow-hidden bg-passive-super-light">
      <div className="relative w-fit">
        <div className="rounded-0 relative mb-4 w-full border border-solid border-border bg-default px-8 py-8 md:rounded md:p-12">
          <button
            className="absolute right-4 top-4 rounded-full p-1 hover:bg-info-backdrop"
            onClick={() => {
              application.purchaseFlowController.closePurchaseFlow()
            }}
          >
            <Icon type="close" className="text-neutral" />
          </button>
          <SNLogoFull className="mb-5 h-7" />
          <PurchaseFlowPaneSelector currentPane={currentPane} application={application} />
        </div>
        <div className="flex justify-end px-4 md:px-0">
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
