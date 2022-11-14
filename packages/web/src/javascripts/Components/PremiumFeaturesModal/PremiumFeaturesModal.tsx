import { AlertDialog } from '@reach/alert-dialog'
import { FunctionComponent, useRef } from 'react'
import { WebApplication } from '@/Application/Application'
import { PremiumFeatureModalType } from './PremiumFeatureModalType'
import { FeatureName } from '@/Controllers/FeatureName'
import { SuccessPrompt } from './Subviews/SuccessPrompt'
import { UpgradePrompt } from './Subviews/UpgradePrompt'

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
  const ctaButtonRef = useRef<HTMLButtonElement>(null)

  if (!showModal) {
    return null
  }

  return (
    <AlertDialog leastDestructiveRef={ctaButtonRef} className="p-0">
      <div tabIndex={-1} className="sn-component">
        <div tabIndex={0} className="max-w-89 rounded bg-default p-4 shadow-main">
          {type === PremiumFeatureModalType.UpgradePrompt && (
            <UpgradePrompt
              featureName={featureName}
              ctaRef={ctaButtonRef}
              application={application}
              hasAccount={hasAccount}
              hasSubscription={hasSubscription}
              onClose={onClose}
            />
          )}

          {type === PremiumFeatureModalType.UpgradeSuccess && <SuccessPrompt ctaRef={ctaButtonRef} onClose={onClose} />}
        </div>
      </div>
    </AlertDialog>
  )
}

export default PremiumFeaturesModal
