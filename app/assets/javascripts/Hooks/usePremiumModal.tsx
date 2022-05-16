import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { ComponentChildren, FunctionalComponent } from 'preact'
import { useCallback, useContext } from 'preact/hooks'
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
  children: ComponentChildren | ComponentChildren[]
}

export const PremiumModalProvider: FunctionalComponent<Props> = observer(
  ({ application, appState, children }: Props) => {
    const dealloced = !appState || appState.dealloced == undefined
    if (dealloced) {
      return null
    }

    const featureName = appState.features.premiumAlertFeatureName || ''

    const showModal = !!featureName

    const hasSubscription = Boolean(
      appState.subscription.userSubscription &&
        !appState.subscription.isUserSubscriptionExpired &&
        !appState.subscription.isUserSubscriptionCanceled,
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
  },
)
