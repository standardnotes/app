import { SNApplication } from '@standardnotes/snjs';

export function openSubscriptionDashboard(application: SNApplication): void {
  application.getNewSubscriptionToken().then((token) => {
    if (!token) {
      return;
    }
    window.open(`${window.dashboardUrl}?subscription_token=${token}`);
  });
}
