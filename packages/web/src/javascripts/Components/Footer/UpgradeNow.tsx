import { WebApplication } from '@/Application/Application'
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

  const onClick = useCallback(() => {
    if (hasAccount && application.isNativeIOS()) {
      application.showPremiumModal()
    } else {
      application.openPurchaseFlow()
    }
  }, [application, hasAccount])

  return shouldShowCTA ? (
    <div className="flex h-full items-center px-2">
      <button
        className="rounded bg-info py-0.5 px-1.5 text-sm font-bold uppercase text-info-contrast hover:brightness-125 lg:text-xs"
        onClick={onClick}
      >
        {hasAccount ? 'Unlock features' : 'Sign up to sync'}
      </button>
    </div>
  ) : null
}

export default observer(UpgradeNow)
