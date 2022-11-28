import { WebApplication } from '@/Application/Application'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, createContext, useCallback, useContext, ReactNode } from 'react'
import PremiumFeaturesModal from '@/Components/PremiumFeaturesModal/PremiumFeaturesModal'
import { FeaturesController } from '@/Controllers/FeaturesController'

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
  featuresController: FeaturesController
  children: ReactNode
}

const PremiumModalProvider: FunctionComponent<Props> = observer(
  ({ application, featuresController, children }: Props) => {
    const featureName = featuresController.premiumAlertFeatureName || ''

    const hasSubscription = application.hasValidSubscription()

    const activate = useCallback(
      (feature: string) => {
        featuresController.showPremiumAlert(feature).catch(console.error)
      },
      [featuresController],
    )

    const close = useCallback(() => {
      featuresController.closePremiumAlert()
    }, [featuresController])

    return (
      <>
        {featuresController.premiumAlertType != undefined && (
          <PremiumFeaturesModal
            application={application}
            featureName={featureName}
            hasSubscription={hasSubscription}
            onClose={close}
            showModal={featuresController.premiumAlertType != undefined}
            type={featuresController.premiumAlertType}
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
  featuresController,
  children,
}) => {
  return <PremiumModalProvider application={application} featuresController={featuresController} children={children} />
}

export default observer(PremiumModalProviderWithDeallocateHandling)
