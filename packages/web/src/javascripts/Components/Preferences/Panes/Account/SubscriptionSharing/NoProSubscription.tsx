import { FunctionComponent, useState } from 'react'
import { LinkButton, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/Application'

type Props = {
  application: WebApplication
}

const NoProSubscription: FunctionComponent<Props> = ({ application }) => {
  const [isLoadingPurchaseFlow, setIsLoadingPurchaseFlow] = useState(false)
  const [purchaseFlowError, setPurchaseFlowError] = useState<string | undefined>(undefined)

  const onPurchaseClick = async () => {
    const errorMessage = 'There was an error when attempting to redirect you to the subscription page.'
    setIsLoadingPurchaseFlow(true)
    try {
      application.openPurchaseFlow()
    } catch (e) {
      setPurchaseFlowError(errorMessage)
    } finally {
      setIsLoadingPurchaseFlow(false)
    }
  }

  return (
    <>
      <Text>
        Subscription sharing is available only on the <span className="font-bold">Professional</span> plan. Please
        upgrade in order to share your subscription.
      </Text>
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
