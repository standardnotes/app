import { AlertDialog, AlertDialogDescription, AlertDialogLabel } from '@reach/alert-dialog'
import { FunctionComponent, useCallback, useRef } from 'react'
import Icon from '@/Components/Icon/Icon'
import { WebApplication } from '@/Application/Application'
import { openSubscriptionDashboard } from '@/Utils/ManageSubscription'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'
import { PremiumFeatureModalType } from './PremiumFeatureModalType'
import { FeatureName } from '@/Controllers/FeatureName'

type Props = {
  application: WebApplication
  featureName: FeatureName | string
  hasSubscription: boolean
  hasAccount: boolean
  onClose: () => void
  showModal: boolean
  type: PremiumFeatureModalType
}

const PremiumFeaturesModal: FunctionComponent<Props> = ({
  application,
  featureName,
  hasSubscription,
  hasAccount,
  onClose,
  showModal,
  type = PremiumFeatureModalType.UpgradePrompt,
}) => {
  const plansButtonRef = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback(() => {
    if (hasSubscription) {
      void openSubscriptionDashboard(application)
    } else if (hasAccount) {
      void application.openPurchaseFlow()
    } else if (window.plansUrl) {
      window.location.assign(window.plansUrl)
    }
    onClose()
  }, [application, hasSubscription, hasAccount, onClose])

  const UpgradePrompt = (
    <>
      <AlertDialogDescription className="mb-2 px-4.5 text-center text-sm text-passive-1">
        To take advantage of <span className="font-semibold">{featureName}</span> and other advanced features, upgrade
        your current plan.
      </AlertDialogDescription>

      <div className="p-4">
        <button
          onClick={handleClick}
          className="no-border w-full cursor-pointer rounded bg-info py-2 font-bold text-info-contrast hover:brightness-125 focus:brightness-125"
          ref={plansButtonRef}
        >
          Upgrade
        </button>
      </div>
    </>
  )

  const SuccessPrompt = (
    <>
      <AlertDialogDescription className="mb-2 px-4.5 text-center text-sm text-passive-1">
        Enjoy your new powered up experience.
      </AlertDialogDescription>

      <div className="p-4">
        <button
          onClick={onClose}
          className="no-border w-full cursor-pointer rounded bg-info py-2 font-bold text-info-contrast hover:brightness-125 focus:brightness-125"
          ref={plansButtonRef}
        >
          Continue
        </button>
      </div>
    </>
  )

  const title =
    type === PremiumFeatureModalType.UpgradePrompt ? 'Enable Advanced Features' : 'Your purchase was successful!'

  const iconName = type === PremiumFeatureModalType.UpgradePrompt ? PremiumFeatureIconName : '🎉'
  const iconClass =
    type === PremiumFeatureModalType.UpgradePrompt
      ? `h-12 w-12 ${PremiumFeatureIconClass}`
      : 'px-7 py-2 h-24 w-24 text-[50px]'

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
              <Icon className={iconClass} size={'custom'} type={iconName} />
            </div>
            <div className="mb-1 text-center text-lg font-bold">{title}</div>
          </AlertDialogLabel>
          {type === PremiumFeatureModalType.UpgradePrompt ? UpgradePrompt : SuccessPrompt}
        </div>
      </div>
    </AlertDialog>
  ) : null
}

export default PremiumFeaturesModal
