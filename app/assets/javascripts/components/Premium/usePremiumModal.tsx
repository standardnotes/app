import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionalComponent } from 'preact';
import { useContext } from 'preact/hooks';
import { createContext } from 'react';
import { PremiumFeaturesModal } from '../PremiumFeaturesModal';

type PremiumModalContextData = {
  activate: (featureName: string) => void;
};

const PremiumModalContext = createContext<PremiumModalContextData | null>(null);

const PremiumModalProvider_ = PremiumModalContext.Provider;

export const usePremiumModal = (): PremiumModalContextData => {
  const value = useContext(PremiumModalContext);

  if (!value) {
    throw new Error('invalid PremiumModal context');
  }

  return value;
};

interface Props {
  application: WebApplication;
  appState: AppState;
}

export const PremiumModalProvider: FunctionalComponent<Props> = observer(
  ({ application, appState, children }) => {
    const featureName = appState.features._premiumAlertFeatureName;
    const activate = appState.features.showPremiumAlert;
    const close = appState.features.closePremiumAlert;

    const showModal = !!featureName;

    const hasSubscription = Boolean(
      appState.subscription.userSubscription &&
        !appState.subscription.isUserSubscriptionExpired &&
        !appState.subscription.isUserSubscriptionCanceled
    );

    return (
      <>
        {showModal && (
          <PremiumFeaturesModal
            application={application}
            featureName={featureName}
            hasSubscription={hasSubscription}
            onClose={close}
            showModal={!!featureName}
          />
        )}
        <PremiumModalProvider_ value={{ activate }}>
          {children}
        </PremiumModalProvider_>
      </>
    );
  }
);
