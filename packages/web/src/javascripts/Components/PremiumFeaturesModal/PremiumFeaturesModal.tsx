import { FunctionComponent, useRef } from 'react'
import { WebApplication } from '@/Application/WebApplication'
import { PremiumFeatureModalType } from './PremiumFeatureModalType'
import { FeatureName } from '@/Controllers/FeatureName'
import { SuccessPrompt } from './Subviews/SuccessPrompt'
import { UpgradePrompt } from './Subviews/UpgradePrompt'
import Modal from '../Modal/Modal'

type Props = {
  application: WebApplication
  featureName?: FeatureName | string
  hasSubscription: boolean
  onClose: () => void
  type: PremiumFeatureModalType
}

const PremiumFeaturesModal: FunctionComponent<Props> = ({
  application,
  featureName,
  hasSubscription,
  onClose,
  type = PremiumFeatureModalType.UpgradePrompt,
}) => {
  const ctaButtonRef = useRef<HTMLButtonElement>(null)

  return (
    <Modal close={onClose} title="Upgrade" className="px-6 py-5" customHeader={<></>}>
      <div tabIndex={-1} className="sn-component">
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
    </Modal>
  )
}

export default PremiumFeaturesModal
