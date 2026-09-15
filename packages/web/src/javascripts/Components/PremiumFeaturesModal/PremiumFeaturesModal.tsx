import { FunctionComponent, useRef } from 'react'
import { WebApplication } from '@/Application/WebApplication'
import { PremiumFeatureModalType } from './PremiumFeatureModalType'
import { FeatureName } from '@/Controllers/FeatureName'
import { SuccessPrompt } from './Subviews/SuccessPrompt'
import { UpgradePrompt } from './Subviews/UpgradePrompt'
import Modal from '../Modal/Modal'
import SuperDemo from './Subviews/SuperDemo'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { SuperName, jtString } from '@standardnotes/features'
import { c } from 'ttag'

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

  const isShowingSuperDemo = type === PremiumFeatureModalType.SuperDemo

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  return (
    <Modal
      close={onClose}
      title={
        isShowingSuperDemo
          ? jtString(c('B7.FilesSubscriptionHelp.Subscription.Title').jt`Try out ${SuperName}`)
          : c('B7.FilesSubscriptionHelp.Subscription.Title').t`Upgrade`
      }
      className={isShowingSuperDemo ? '' : 'px-6 py-5'}
      customHeader={isShowingSuperDemo ? undefined : <></>}
      actions={
        isShowingSuperDemo
          ? [
              {
                label: c('B7.FilesSubscriptionHelp.Subscription.Action').t`Done`,
                type: 'primary',
                onClick: onClose,
                hidden: !isMobileScreen,
                mobileSlot: 'right',
              },
            ]
          : undefined
      }
    >
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
      {type === PremiumFeatureModalType.SuperDemo && <SuperDemo hasSubscription={hasSubscription} onClose={onClose} />}
    </Modal>
  )
}

export default PremiumFeaturesModal
