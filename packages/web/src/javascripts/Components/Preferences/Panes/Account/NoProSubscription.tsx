import { FunctionComponent, ReactNode, useState } from 'react'
import { LinkButton, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/WebApplication'

type Props = {
  application: WebApplication
  text: ReactNode
}

const NoProSubscription: FunctionComponent<Props> = ({ application, text }) => {
  const [isLoadingPurchaseFlow, setIsLoadingPurchaseFlow] = useState(false)
  const [purchaseFlowError, setPurchaseFlowError] = useState<string | undefined>(undefined)

  const onPurchaseClick = async () => {
    const errorMessage = 'There was an error when attempting to redirect you to the subscription page.'
    setIsLoadingPurchaseFlow(true)
    try {
      if (application.isNativeIOS()) {
        application.showPremiumModal()
      } else {
        void application.openPurchaseFlow()
      }
    } catch (e) {
      setPurchaseFlowError(errorMessage)
    } finally {
      setIsLoadingPurchaseFlow(false)
    }
  }

  return (
    <>
      <Text>{text}</Text>
      {isLoadingPurchaseFlow && <Text>Redirecting you to the subscription page...</Text>}
      {purchaseFlowError && <Text className="text-danger">{purchaseFlowError}</Text>}

      <div className="flex">
        {!application.hideOutboundSubscriptionLinks && (
          <LinkButton className="mt-3 mr-3 min-w-20" label="Learn More" link={window.plansUrl as string} />
        )}
        {application.hasAccount() && (
          <Button className="mt-3 min-w-20" primary label="Upgrade" onClick={onPurchaseClick} />
        )}
      </div>
    </>
  )
}

export default NoProSubscription
