import { FeaturesState } from '@/ui_models/app_state/features_state';
import { observer } from 'mobx-react-lite';
import { FunctionalComponent } from 'preact';
import { useCallback, useContext, useState } from 'preact/hooks';
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
  state: FeaturesState;
}

export const PremiumModalProvider: FunctionalComponent<Props> = observer(
  ({ state, children }) => {
    const featureName = state._premiumAlertFeatureName;
    const activate = state.showPremiumAlert;
    const close = state.closePremiumAlert;

    const showModal = !!featureName;

    return (
      <>
        {showModal && (
          <PremiumFeaturesModal
            showModal={!!featureName}
            featureName={featureName}
            onClose={close}
          />
        )}
        <PremiumModalProvider_ value={{ activate }}>
          {children}
        </PremiumModalProvider_>
      </>
    );
  }
);
