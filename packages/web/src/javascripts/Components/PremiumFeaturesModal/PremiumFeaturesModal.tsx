import { AlertDialog, AlertDialogDescription, AlertDialogLabel } from '@reach/alert-dialog'
import { FunctionComponent, useCallback, useRef } from 'react'
import Icon from '@/Components/Icon/Icon'
import { WebApplication } from '@/Application/Application'
import { openSubscriptionDashboard } from '@/Utils/ManageSubscription'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'
import { loadPurchaseFlowUrl } from '../PurchaseFlow/PurchaseFlowFunctions'

type Props = {
  application: WebApplication
  featureName: string
  hasSubscription: boolean
  hasAccount: boolean
  onClose: () => void
  showModal: boolean
}

const PremiumFeaturesModal: FunctionComponent<Props> = ({
  application,
  featureName,
  hasSubscription,
  hasAccount,
  onClose,
  showModal,
}) => {
  const plansButtonRef = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback(() => {
    if (hasSubscription) {
      void openSubscriptionDashboard(application)
    } else if (hasAccount) {
      void loadPurchaseFlowUrl(application)
    } else if (window.plansUrl) {
      window.location.assign(window.plansUrl)
    }
  }, [application, hasSubscription, hasAccount])

  return showModal ? (
    <AlertDialog leastDestructiveRef={plansButtonRef} className="p-0">
      <div tabIndex={-1} className="sn-component">
        <div tabIndex={0} className="max-w-89 rounded bg-default p-4 shadow-main">
          <AlertDialogLabel>
            <div className="flex justify-end p-1">
              <button
                className="flex cursor-pointer border-0 bg-transparent p-0"
                onClick={onClose}
                aria-label="Close modal"
              >
                <Icon className="text-neutral" type="close" />
              </button>
            </div>
            <div
              className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[50%] bg-contrast"
              aria-hidden={true}
            >
              <Icon className={`h-12 w-12 ${PremiumFeatureIconClass}`} type={PremiumFeatureIconName} />
            </div>
            <div className="mb-1 text-center text-lg font-bold">Enable Advanced Features</div>
          </AlertDialogLabel>
          <AlertDialogDescription className="mb-2 px-4.5 text-center text-sm text-passive-1">
            To take advantage of <span className="font-semibold">{featureName}</span> and other advanced features,
            upgrade your current plan.
          </AlertDialogDescription>
          {!application.hideSubscriptionMarketing && (
            <div className="p-4">
              <button
                onClick={handleClick}
                className="no-border w-full cursor-pointer rounded bg-info py-2 font-bold text-info-contrast hover:brightness-125 focus:brightness-125"
                ref={plansButtonRef}
              >
                Upgrade
              </button>
            </div>
          )}
        </div>
      </div>
    </AlertDialog>
  ) : null
}

export default PremiumFeaturesModal
