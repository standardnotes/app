import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { PurchaseFlowView } from './PurchaseFlowView';

export type PurchaseFlowWrapperProps = {
  appState: AppState;
  application: WebApplication;
};

export const PurchaseFlowWrapper: FunctionComponent<PurchaseFlowWrapperProps> =
  observer(({ appState, application }) => {
    if (!appState.purchaseFlow.isOpen) {
      return null;
    }

    return <PurchaseFlowView appState={appState} application={application} />;
  });
