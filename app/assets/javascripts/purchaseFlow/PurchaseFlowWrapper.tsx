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

export const getPurchaseFlowUrl = async (
  application: WebApplication
): Promise<string | undefined> => {
  const currentUrl = window.location.origin;
  const successUrl = isDesktopApplication() ? `standardnotes://` : currentUrl;
  if (application.noAccount()) {
    return `${window._purchase_url}/offline?&success_url=${successUrl}`;
  }
  const token = await application.getNewSubscriptionToken();
  if (token) {
    return `${window._purchase_url}?subscription_token=${token}&success_url=${successUrl}`;
  }
  return undefined;
};

export const loadPurchaseFlowUrl = async (
  application: WebApplication
): Promise<boolean> => {
  const url = await getPurchaseFlowUrl(application);
  const params = new URLSearchParams(window.location.search);
  const period = params.get('period') ? `&period=${params.get('period')}` : '';
  const plan = params.get('plan') ? `&plan=${params.get('plan')}` : '';
  if (url) {
    window.location.assign(`${url}${period}${plan}`);
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
