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

export const PremiumModalProvider: FunctionalComponent = ({ children }) => {
  const [featureName, setFeatureName] = useState<null | string>(null);

  const activate = setFeatureName;

  const closeModal = useCallback(() => {
    setFeatureName(null);
  }, [setFeatureName]);

  const showModal = !!featureName;

  return (
    <>
      {showModal && (
        <PremiumFeaturesModal
          showModal={!!featureName}
          featureName={featureName}
          onClose={closeModal}
        />
      )}
      <PremiumModalProvider_ value={{ activate }}>
        {children}
      </PremiumModalProvider_>
    </>
  );
};
