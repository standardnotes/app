import { AlertDialog, AlertDialogDescription, AlertDialogLabel } from '@reach/alert-dialog'
import { FunctionComponent, useCallback, useRef } from 'react'
import Icon from '@/Components/Icon/Icon'
import { PremiumIllustration } from '@standardnotes/icons'
import { WebApplication } from '@/Application/Application'
import { openSubscriptionDashboard } from '@/Utils/ManageSubscription'

type Props = {
  application: WebApplication
  featureName: string
  hasSubscription: boolean
  onClose: () => void
  showModal: boolean
}

const PremiumFeaturesModal: FunctionComponent<Props> = ({
  application,
  featureName,
  hasSubscription,
  onClose,
  showModal,
}) => {
  const plansButtonRef = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback(() => {
    if (hasSubscription) {
      openSubscriptionDashboard(application)
    } else if (window.plansUrl) {
      window.location.assign(window.plansUrl)
    }
  }, [application, hasSubscription])

  return showModal ? (
    <AlertDialog leastDestructiveRef={plansButtonRef} className="p-0">
      <div tabIndex={-1} className="sn-component">
        <div tabIndex={0} className="max-w-89 bg-default rounded shadow-main p-4">
          <AlertDialogLabel>
            <div className="flex justify-end p-1">
              <button
                className="flex p-0 cursor-pointer bg-transparent border-0"
                onClick={onClose}
                aria-label="Close modal"
              >
                <Icon className="text-neutral" type="close" />
              </button>
            </div>
            <div className="flex items-center justify-center p-1" aria-hidden={true}>
              <PremiumIllustration className="mb-2" />
            </div>
            <div className="text-lg text-center font-bold mb-1">Enable Advanced Features</div>
          </AlertDialogLabel>
          <AlertDialogDescription className="text-sm text-center text-passive-1 px-4.5 mb-2">
            In order to use <span className="font-semibold">{featureName}</span> and other advanced features, please
            purchase a subscription or upgrade your current plan.
          </AlertDialogDescription>
          <div className="p-4">
            <button
              onClick={handleClick}
              className="w-full rounded no-border py-2 font-bold bg-info text-info-contrast hover:brightness-125 focus:brightness-125 cursor-pointer"
              ref={plansButtonRef}
            >
              {hasSubscription ? 'Upgrade Plan' : 'See Plans'}
            </button>
          </div>
        </div>
      </div>
    </AlertDialog>
  ) : null
}

export default PremiumFeaturesModal
