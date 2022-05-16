import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FunctionalComponent } from 'preact'
import { useCallback, useContext, useMemo } from 'preact/hooks'
import { createContext } from 'react'
import { PremiumFeaturesModal } from '@/Components/PremiumFeaturesModal'

type PremiumModalContextData = {
  activate: (featureName: string) => void
}

const PremiumModalContext = createContext<PremiumModalContextData | null>(null)

const PremiumModalProvider_ = PremiumModalContext.Provider

export const usePremiumModal = (): PremiumModalContextData => {
  const value = useContext(PremiumModalContext)

  if (!value) {
    throw new Error('invalid PremiumModal context')
  }

  return value
}

interface Props {
  application: WebApplication
  appState: AppState
}

export const PremiumModalProvider: FunctionalComponent<Props> = observer(({ application, appState, children }) => {
  const featureName = useMemo(
    () => appState.features.premiumAlertFeatureName || '',
    [appState.features.premiumAlertFeatureName],
  )

  const showModal = useMemo(() => !!featureName, [featureName])

  const hasSubscription = useMemo(
    () =>
      Boolean(
        appState.subscription.userSubscription &&
          !appState.subscription.isUserSubscriptionExpired &&
          !appState.subscription.isUserSubscriptionCanceled,
      ),
    [
      appState.subscription.userSubscription,
      appState.subscription.isUserSubscriptionExpired,
      appState.subscription.isUserSubscriptionCanceled,
    ],
  )

  const activate = useCallback(
    (feature: string) => {
      appState.features.showPremiumAlert(feature).catch(console.error)
    },
    [appState],
  )

  const close = useCallback(() => {
    appState.features.closePremiumAlert()
  }, [appState])

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
      <PremiumModalProvider_ value={{ activate }}>{children}</PremiumModalProvider_>
    </>
  )
})
