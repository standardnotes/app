import { FunctionComponent, ReactNode, useState } from 'react'
import { LinkButton, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/WebApplication'
import { c } from 'ttag'

type Props = {
  application: WebApplication
  text: ReactNode
}

const NoProSubscription: FunctionComponent<Props> = ({ application, text }) => {
  const [isLoadingPurchaseFlow, setIsLoadingPurchaseFlow] = useState(false)
  const [purchaseFlowError, setPurchaseFlowError] = useState<string | undefined>(undefined)

  const onPurchaseClick = async () => {
    const errorMessage = c('B6.Preferences.Account.Error')
      .t`There was an error when attempting to redirect you to the subscription page.`
    setIsLoadingPurchaseFlow(true)
    try {
      if (application.isNativeIOS()) {
        application.showPremiumModal()
      } else if (application.hasValidFirstPartySubscription()) {
        void application.openSubscriptionDashboard.execute()
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
      {isLoadingPurchaseFlow && (
        <Text>{c('B6.Preferences.Account.Info').t`Redirecting you to the subscription page...`}</Text>
      )}
      {purchaseFlowError && <Text className="text-danger">{purchaseFlowError}</Text>}

      <div className="flex">
        {!application.hideOutboundSubscriptionLinks && (
          <LinkButton
            className="mr-3 mt-3 min-w-20"
            label={c('B6.Preferences.Account.Label').t`Learn More`}
            link={window.plansUrl as string}
          />
        )}
        {application.hasAccount() && application.canShowPurchaseFlow() && (
          <Button
            className="mt-3 min-w-20"
            primary
            label={c('B6.Preferences.Account.Label').t`Upgrade`}
            onClick={onPurchaseClick}
          />
        )}
      </div>
    </>
  )
}

export default NoProSubscription
