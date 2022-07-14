import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, createContext, useCallback, useContext, ReactNode } from 'react'
import PremiumFeaturesModal from '@/Components/PremiumFeaturesModal/PremiumFeaturesModal'

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
  viewControllerManager: ViewControllerManager
  children: ReactNode
}

const PremiumModalProvider: FunctionComponent<Props> = observer(
  ({ application, viewControllerManager, children }: Props) => {
    const featureName = viewControllerManager.featuresController.premiumAlertFeatureName || ''

    const showModal = !!featureName

    const hasSubscription = Boolean(
      viewControllerManager.subscriptionController.userSubscription &&
        !viewControllerManager.subscriptionController.isUserSubscriptionExpired &&
        !viewControllerManager.subscriptionController.isUserSubscriptionCanceled,
    )

    const hasAccount = application.hasAccount()

    const activate = useCallback(
      (feature: string) => {
        viewControllerManager.featuresController.showPremiumAlert(feature).catch(console.error)
      },
      [viewControllerManager],
    )

    const close = useCallback(() => {
      viewControllerManager.featuresController.closePremiumAlert()
    }, [viewControllerManager])

    return (
      <>
        {showModal && (
          <PremiumFeaturesModal
            application={application}
            featureName={featureName}
            hasSubscription={hasSubscription}
            hasAccount={hasAccount}
            onClose={close}
            showModal={!!featureName}
          />
        )}
        <PremiumModalProvider_ value={{ activate }}>{children}</PremiumModalProvider_>
      </>
    )
  },
)

PremiumModalProvider.displayName = 'PremiumModalProvider'

const PremiumModalProviderWithDeallocateHandling: FunctionComponent<Props> = ({
  application,
  viewControllerManager,
  children,
}) => {
  return (
    <PremiumModalProvider application={application} viewControllerManager={viewControllerManager} children={children} />
  )
}

export default observer(PremiumModalProviderWithDeallocateHandling)
