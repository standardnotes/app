import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { isDesktopApplication } from '@/utils';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { PurchaseFlowView } from './PurchaseFlowView';

export type PurchaseFlowWrapperProps = {
  appState: AppState;
  application: WebApplication;
};

export const loadPurchaseFlowUrl = async (
  application: WebApplication
): Promise<void> => {
  const url = await application.getPurchaseFlowUrl();
  if (url) {
    const currentUrl = window.location.href;
    const successUrl = isDesktopApplication()
      ? `standardnotes://${currentUrl}`
      : currentUrl;
    window.location.assign(`${url}&success_url=${successUrl}`);
  }
};

export const PurchaseFlowWrapper: FunctionComponent<PurchaseFlowWrapperProps> =
  observer(({ appState, application }) => {
    if (!appState.purchaseFlow.isOpen) {
      return null;
    }

    return <PurchaseFlowView appState={appState} application={application} />;
  });
