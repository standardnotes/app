import AlertDialog from '../AlertDialog/AlertDialog'
import { FunctionComponent, useRef } from 'react'
import { WebApplication } from '@/Application/WebApplication'
import { PremiumFeatureModalType } from './PremiumFeatureModalType'
import { FeatureName } from '@/Controllers/FeatureName'
import { SuccessPrompt } from './Subviews/SuccessPrompt'
import { UpgradePrompt } from './Subviews/UpgradePrompt'

type Props = {
  application: WebApplication
  featureName?: FeatureName | string
  hasSubscription: boolean
  onClose: () => void
  showModal: boolean
  type: PremiumFeatureModalType
}

const PremiumFeaturesModal: FunctionComponent<Props> = ({
  application,
  featureName,
  hasSubscription,
  onClose,
  showModal,
  type = PremiumFeatureModalType.UpgradePrompt,
}) => {
  const ctaButtonRef = useRef<HTMLButtonElement>(null)

  if (!showModal) {
    return null
  }

  return (
    <AlertDialog closeDialog={onClose} className="w-full max-w-[90vw] md:max-w-89">
      <div tabIndex={-1} className="sn-component bg-default">
        <div tabIndex={0}>
          {type === PremiumFeatureModalType.UpgradePrompt && (
            <UpgradePrompt
              featureName={featureName}
              ctaRef={ctaButtonRef}
              application={application}
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
