import { FunctionComponent, useState } from 'react'
import { LinkButton, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/WebApplication'
import { c } from 'ttag'

type Props = {
  application: WebApplication
}

const NoSubscription: FunctionComponent<Props> = ({ application }) => {
  const [isLoadingPurchaseFlow, setIsLoadingPurchaseFlow] = useState(false)
  const [purchaseFlowError, setPurchaseFlowError] = useState<string | undefined>(undefined)

  const onPurchaseClick = async () => {
    const errorMessage = c('B6.Preferences.Subscription.Error')
      .t`There was an error when attempting to redirect you to the subscription page.`
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
      <Text>{c('B6.Preferences.Subscription.Info').t`You don't have a Standard Notes subscription yet.`}</Text>
      {isLoadingPurchaseFlow && (
        <Text>{c('B6.Preferences.Subscription.Info').t`Redirecting you to the subscription page...`}</Text>
      )}
      {purchaseFlowError && <Text className="text-danger">{purchaseFlowError}</Text>}
      <div className="flex">
        {!application.hideOutboundSubscriptionLinks && (
          <LinkButton
            className="mr-3 mt-3 min-w-20"
            label={c('B6.Preferences.Subscription.Label').t`Learn More`}
            link={window.plansUrl as string}
          />
        )}
        {application.hasAccount() && application.canShowPurchaseFlow() && (
          <Button
            className="mt-3 min-w-20"
            primary
            label={c('B6.Preferences.Subscription.Label').t`Subscribe`}
            onClick={onPurchaseClick}
          />
        )}
      </div>
    </>
  )
}

export default NoSubscription
