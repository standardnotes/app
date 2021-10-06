import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { PurchaseFlowPane } from '@/ui_models/app_state/purchase_flow_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { CreateAccount } from './panes/CreateAccount';
import SNLogoFull from '../../icons/ic-sn-logo-full.svg';
import { SignIn } from './panes/SignIn';

type PaneSelectorProps = {
  currentPane: PurchaseFlowPane;
} & PurchaseFlowViewProps;

type PurchaseFlowViewProps = {
  appState: AppState;
  application: WebApplication;
};

const PurchaseFlowPaneSelector: FunctionComponent<PaneSelectorProps> = ({
  currentPane,
  appState,
  application,
}) => {
  switch (currentPane) {
    case PurchaseFlowPane.CreateAccount:
      return <CreateAccount appState={appState} application={application} />;
    case PurchaseFlowPane.SignIn:
      return <SignIn appState={appState} application={application} />;
  }
};

export const PurchaseFlowView: FunctionComponent<PurchaseFlowViewProps> =
  observer(({ appState, application }) => {
    const { currentPane } = appState.purchaseFlow;

    return (
      <div className="flex items-center justify-center h-full w-full absolute top-left-0 z-index-purchase-flow bg-grey-2">
        <div className="fit-content">
          <div className="p-8 mb-4 bg-default border-1 border-solid border-gray-300 rounded">
            <SNLogoFull className="mb-5" />
            <PurchaseFlowPaneSelector
              currentPane={currentPane}
              appState={appState}
              application={application}
            />
          </div>
          <div className="flex justify-end">
            <a
              className="mr-3 font-medium color-grey-1"
              href="https://standardnotes.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy
            </a>
            <a
              className="font-medium color-grey-1"
              href="https://standardnotes.com/help"
              target="_blank"
              rel="noopener noreferrer"
            >
              Help
            </a>
          </div>
        </div>
      </div>
    );
  });
