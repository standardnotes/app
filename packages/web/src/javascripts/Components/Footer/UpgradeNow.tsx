import { WebApplication } from '@/Application/WebApplication'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'
import { observer } from 'mobx-react-lite'
import { useCallback } from 'react'

type Props = {
  application: WebApplication
  featuresController: FeaturesController
  subscriptionContoller: SubscriptionController
}

const UpgradeNow = ({ application, featuresController, subscriptionContoller }: Props) => {
  const shouldShowCTA = !featuresController.hasFolders
  const hasAccount = subscriptionContoller.hasAccount
  const hasAccessToFeatures = subscriptionContoller.hasFirstPartyOnlineOrOfflineSubscription()

  const onClick = useCallback(() => {
    if (hasAccount && application.isNativeIOS()) {
      application.showPremiumModal()
    } else {
      void application.openPurchaseFlow()
    }
  }, [application, hasAccount])

  if (!shouldShowCTA || hasAccessToFeatures) {
    return null
  }

  return (
    <div className="flex h-full items-center px-2">
      <button
        className="rounded bg-info px-1.5 py-0.5 text-sm font-bold uppercase text-info-contrast hover:brightness-125 lg:text-xs"
        onClick={onClick}
      >
        {!hasAccount ? 'Sign up to sync' : 'Unlock features'}
      </button>
    </div>
  )
}

export default observer(UpgradeNow)
