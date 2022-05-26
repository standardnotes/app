import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, createContext, useCallback, useContext, ReactNode } from 'react'
import PremiumFeaturesModal from '@/Components/PremiumFeaturesModal/PremiumFeaturesModal'
import DeallocateHandler from '@/Components/DeallocateHandler/DeallocateHandler'

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
  children: ReactNode
}

const PremiumModalProvider: FunctionComponent<Props> = observer(({ application, appState, children }: Props) => {
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
})

PremiumModalProvider.displayName = 'PremiumModalProvider'

const PremiumModalProviderWithDeallocateHandling: FunctionComponent<Props> = ({ application, appState, children }) => {
  return (
    <DeallocateHandler appState={appState}>
      <PremiumModalProvider application={application} appState={appState} children={children} />
    </DeallocateHandler>
  )
}

export default observer(PremiumModalProviderWithDeallocateHandling)
