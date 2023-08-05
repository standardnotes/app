import { WebApplication } from '@/Application/WebApplication'
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
  children: ReactNode
}

const PremiumModalProvider: FunctionComponent<Props> = observer(({ application, children }: Props) => {
  const featureName = application.featuresController.premiumAlertFeatureName || ''

  const hasSubscription = application.hasValidFirstPartySubscription()

  const activate = useCallback(
    (feature: string) => {
      application.featuresController.showPremiumAlert(feature).catch(console.error)
    },
    [application.featuresController],
  )

  const close = useCallback(() => {
    application.featuresController.closePremiumAlert()
  }, [application.featuresController])

  return (
    <>
      {application.featuresController.premiumAlertType != undefined && (
        <PremiumFeaturesModal
          application={application}
          featureName={featureName}
          hasSubscription={hasSubscription}
          onClose={close}
          showModal={application.featuresController.premiumAlertType != undefined}
          type={application.featuresController.premiumAlertType}
        />
      )}
      <PremiumModalProvider_ value={{ activate }}>{children}</PremiumModalProvider_>
    </>
  )
})

PremiumModalProvider.displayName = 'PremiumModalProvider'

const PremiumModalProviderWithDeallocateHandling: FunctionComponent<Props> = ({ application, children }) => {
  return <PremiumModalProvider application={application} children={children} />
}

export default observer(PremiumModalProviderWithDeallocateHandling)
