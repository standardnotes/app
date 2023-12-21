import { WebApplication } from '@/Application/WebApplication'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, createContext, useCallback, useContext, ReactNode, useMemo } from 'react'
import PremiumFeaturesModal from '@/Components/PremiumFeaturesModal/PremiumFeaturesModal'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import { classNames } from '@standardnotes/snjs'
import { PremiumFeatureModalType } from '@/Components/PremiumFeaturesModal/PremiumFeatureModalType'

type PremiumModalContextData = {
  activate: (featureName: string) => void
  showSuperDemo: () => void
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

  const showSuperDemo = useCallback(() => {
    application.featuresController.showSuperDemoModal()
  }, [application.featuresController])

  const value: PremiumModalContextData = useMemo(() => ({ activate, showSuperDemo }), [activate, showSuperDemo])

  return (
    <>
      <ModalOverlay
        isOpen={application.featuresController.premiumAlertType != undefined}
        close={close}
        className={classNames(
          'w-full',
          application.featuresController.premiumAlertType === PremiumFeatureModalType.SuperDemo
            ? 'md:!h-full md:w-full md:max-w-[70vw]'
            : '!h-auto max-w-[90vw] md:max-w-89',
        )}
        backdropClassName="!opacity-50"
      >
        <PremiumFeaturesModal
          application={application}
          featureName={featureName}
          hasSubscription={hasSubscription}
          onClose={close}
          type={application.featuresController.premiumAlertType!}
        />
      </ModalOverlay>
      <PremiumModalProvider_ value={value}>{children}</PremiumModalProvider_>
    </>
  )
})

PremiumModalProvider.displayName = 'PremiumModalProvider'

const PremiumModalProviderWithDeallocateHandling: FunctionComponent<Props> = ({ application, children }) => {
  return <PremiumModalProvider application={application} children={children} />
}

export default observer(PremiumModalProviderWithDeallocateHandling)
