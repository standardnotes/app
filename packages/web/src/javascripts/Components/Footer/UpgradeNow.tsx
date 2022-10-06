import { WebApplication } from '@/Application/Application'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { observer } from 'mobx-react-lite'
import { loadPurchaseFlowUrl } from '../PurchaseFlow/PurchaseFlowFunctions'

type Props = {
  application: WebApplication
  featuresController: FeaturesController
}

const UpgradeNow = ({ application, featuresController }: Props) => {
  const shouldShowCTA = !featuresController.hasFolders
  const hasAccount = application.hasAccount()

  const openPlansPage = () => {
    if (!window.plansUrl) {
      return
    }

    if (application.isNativeMobileWeb()) {
      application.mobileDevice().openUrl(window.plansUrl)
    } else {
      window.location.assign(window.plansUrl)
    }
  }

  return shouldShowCTA ? (
    <div className="flex h-full items-center px-2">
      <button
        className="rounded bg-info py-0.5 px-1.5 text-xs font-bold uppercase text-info-contrast hover:brightness-125"
        onClick={() => {
          if (hasAccount) {
            void loadPurchaseFlowUrl(application)
            return
          }

          openPlansPage()
        }}
      >
        Upgrade now
      </button>
    </div>
  ) : null
}

export default observer(UpgradeNow)
