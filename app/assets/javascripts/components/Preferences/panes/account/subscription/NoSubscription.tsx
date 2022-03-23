import { FunctionalComponent } from 'preact';
import { LinkButton, Text } from '@/components/Preferences/components';
import { Button } from '@/components/Button';
import { WebApplication } from '@/ui_models/application';
import { useState } from 'preact/hooks';
import { loadPurchaseFlowUrl } from '@/components/PurchaseFlow/PurchaseFlowWrapper';

export const NoSubscription: FunctionalComponent<{
  application: WebApplication;
}> = ({ application }) => {
  const [isLoadingPurchaseFlow, setIsLoadingPurchaseFlow] = useState(false);
  const [purchaseFlowError, setPurchaseFlowError] = useState<
    string | undefined
  >(undefined);

  const onPurchaseClick = async () => {
    const errorMessage =
      'There was an error when attempting to redirect you to the subscription page.';
    setIsLoadingPurchaseFlow(true);
    try {
      if (!(await loadPurchaseFlowUrl(application))) {
        setPurchaseFlowError(errorMessage);
      }
    } catch (e) {
      setPurchaseFlowError(errorMessage);
    } finally {
      setIsLoadingPurchaseFlow(false);
    }
  };

  return (
    <>
      <Text>You don't have a Standard Notes subscription yet.</Text>
      {isLoadingPurchaseFlow && (
        <Text>Redirecting you to the subscription page...</Text>
      )}
      {purchaseFlowError && (
        <Text className="color-danger">{purchaseFlowError}</Text>
      )}
      <div className="flex">
        <LinkButton
          className="min-w-20 mt-3 mr-3"
          label="Learn More"
          link={window.plansUrl as string}
        />
        {application.hasAccount() && (
          <Button
            className="min-w-20 mt-3"
            type="primary"
            label="Subscribe"
            onClick={onPurchaseClick}
          />
        )}
      </div>
    </>
  );
};
