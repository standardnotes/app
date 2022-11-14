import { AlertDialogDescription, AlertDialogLabel } from '@reach/alert-dialog'
import { useCallback } from 'react'
import { WebApplication } from '@/Application/Application'
import { openSubscriptionDashboard } from '@/Utils/ManageSubscription'
import Icon from '@/Components/Icon/Icon'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '@/Components/Icon/PremiumFeatureIcon'

export const UpgradePrompt = ({
  featureName,
  ctaRef,
  application,
  hasSubscription,
  hasAccount,
  onClose,
}: {
  featureName: string
  ctaRef: React.RefObject<HTMLButtonElement>
  application: WebApplication
  hasSubscription: boolean
  hasAccount: boolean
  onClose: () => void
}) => {
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

  return (
    <>
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
          <Icon className={`h-12 w-12 ${PremiumFeatureIconClass}`} size={'custom'} type={PremiumFeatureIconName} />
        </div>
        <div className="mb-1 text-center text-lg font-bold">Enable Advanced Features</div>
      </AlertDialogLabel>
      <AlertDialogDescription className="mb-2 px-4.5 text-center text-sm text-passive-1">
        To take advantage of <span className="font-semibold">{featureName}</span> and other advanced features, upgrade
        your current plan.
        {application.isNativeIOS() && (
          <div className="mt-2">
            <div className="mb-2 font-bold">The Professional Plan costs $99.99/year and includes benefits like</div>
            <ul className="list-inside list-[circle]">
              <li>100GB encrypted file storage</li>
              <li>Access to all note types, including markdown, rich text, authenticator, tasks, and spreadsheets</li>
              <li>Note history going back indefinitely</li>
              <li>Nested folders for your tags</li>
              <li>Premium support</li>
            </ul>
          </div>
        )}
      </AlertDialogDescription>

      <div className="p-4">
        <button
          onClick={handleClick}
          className="no-border w-full cursor-pointer rounded bg-info py-2 font-bold text-info-contrast hover:brightness-125 focus:brightness-125"
          ref={ctaRef}
        >
          Upgrade
        </button>
      </div>
    </>
  )
}
