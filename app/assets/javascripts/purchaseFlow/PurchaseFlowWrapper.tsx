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

export const getPurchaseFlowUrl = async (application: WebApplication): Promise<string | undefined> => {
  const token = await application.getNewSubscriptionToken();
  if (token) {
    const currentUrl = window.location.href;
    const successUrl = isDesktopApplication() ? `standardnotes://${currentUrl}` : currentUrl;
    return `${window._purchase_url}?subscription_token=${token}&success_url=${successUrl}`;
  }
  return undefined;
};

export const loadPurchaseFlowUrl = async (
  application: WebApplication
): Promise<boolean> => {
  const url = await getPurchaseFlowUrl(application);
  if (url) {
    window.location.assign(url);
    return true;
  }
  return false;
};

export const PurchaseFlowWrapper: FunctionComponent<PurchaseFlowWrapperProps> =
  observer(({ appState, application }) => {
    if (!appState.purchaseFlow.isOpen) {
      return null;
    }

    return <PurchaseFlowView appState={appState} application={application} />;
  });
