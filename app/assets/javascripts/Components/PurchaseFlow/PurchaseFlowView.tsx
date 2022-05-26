import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { PurchaseFlowPane } from '@/UIModels/AppState/PurchaseFlowPane'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import CreateAccount from './Panes/CreateAccount'
import SignIn from './Panes/SignIn'
import { SNLogoFull } from '@standardnotes/icons'

type PaneSelectorProps = {
  currentPane: PurchaseFlowPane
} & PurchaseFlowViewProps

type PurchaseFlowViewProps = {
  appState: AppState
  application: WebApplication
}

const PurchaseFlowPaneSelector: FunctionComponent<PaneSelectorProps> = ({ currentPane, appState, application }) => {
  switch (currentPane) {
    case PurchaseFlowPane.CreateAccount:
      return <CreateAccount appState={appState} application={application} />
    case PurchaseFlowPane.SignIn:
      return <SignIn appState={appState} application={application} />
  }
}

const PurchaseFlowView: FunctionComponent<PurchaseFlowViewProps> = ({ appState, application }) => {
  const { currentPane } = appState.purchaseFlow

  return (
    <div className="flex items-center justify-center overflow-hidden h-full w-full absolute top-left-0 z-index-purchase-flow bg-passive-super-light">
      <div className="relative fit-content">
        <div className="relative p-12 xs:px-8 mb-4 bg-default border-1 border-solid border-main rounded xs:rounded-0">
          <SNLogoFull className="mb-5" />
          <PurchaseFlowPaneSelector currentPane={currentPane} appState={appState} application={application} />
        </div>
        <div className="flex justify-end xs:px-4">
          <a
            className="mr-3 font-medium color-passive-1"
            href="https://standardnotes.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy
          </a>
          <a
            className="font-medium color-passive-1"
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
