import { useCallback } from 'react'
import { WebApplication } from '@/Application/WebApplication'
import Icon from '@/Components/Icon/Icon'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '@/Components/Icon/PremiumFeatureIcon'
import { classNames } from '@standardnotes/snjs'
import { requestCloseAllOpenModalsAndPopovers } from '@/Utils/CloseOpenModalsAndPopovers'
import {
  AuthenticatorName,
  ChecklistEditorName,
  jtString,
  MarkdownEditorName,
  RichTextEditorName,
  SpreadsheetName,
  SuperName,
  ProfessionalPlanName,
} from '@standardnotes/features'
import { c } from 'ttag'

type Props = {
  featureName?: string
  ctaRef: React.RefObject<HTMLButtonElement>
  application: WebApplication
  hasSubscription: boolean
  onClick?: () => void
} & (
  | {
      inline: true
      preferHorizontalLayout?: boolean
      onClose?: never
    }
  | {
      inline?: false
      preferHorizontalLayout?: never
      onClose: () => void
    }
)

export const UpgradePrompt = ({
  featureName,
  ctaRef,
  application,
  hasSubscription,
  onClose,
  onClick,
  inline,
  preferHorizontalLayout = false,
}: Props) => {
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick()
    }
    requestCloseAllOpenModalsAndPopovers()
    if (hasSubscription && !application.isNativeIOS()) {
      void application.openSubscriptionDashboard.execute()
    } else {
      void application.openPurchaseFlow()
    }
    if (onClose) {
      onClose()
    }
  }, [application, hasSubscription, onClose, onClick])

  const featureNameBold = featureName ? <span className="font-semibold">{featureName}</span> : undefined

  return (
    <div className={preferHorizontalLayout ? 'flex flex-wrap items-center gap-4 md:flex-nowrap' : ''}>
      {!inline && (
        <div className="flex justify-end p-1">
          <button
            className="flex cursor-pointer border-0 bg-transparent p-0"
            onClick={onClose}
            aria-label={c('B2.NavSharedUI.AriaLabel').t`Close modal`}
          >
            <Icon className="text-neutral" type="close" />
          </button>
        </div>
      )}
      <div
        className={classNames(
          'flex items-center justify-center rounded-[50%] bg-contrast',
          preferHorizontalLayout ? 'h-12 w-12 flex-shrink-0' : 'mx-auto mb-5 h-24 w-24',
        )}
        aria-hidden={true}
      >
        <Icon
          className={classNames(preferHorizontalLayout ? 'h-8 w-8' : 'h-12 w-12', PremiumFeatureIconClass)}
          size={'custom'}
          type={PremiumFeatureIconName}
        />
      </div>
      <div className={preferHorizontalLayout ? '' : 'mb-2'}>
        <div className={classNames('mb-1 text-lg font-bold', preferHorizontalLayout ? 'text-left' : 'text-center')}>
          {c('B7.FilesSubscriptionHelp.Subscription.Title').t`Enable Advanced Features`}
        </div>
        <div
          className={classNames('text-sm text-passive-1', preferHorizontalLayout ? 'text-left' : 'px-4.5 text-center')}
        >
          {featureNameBold && (
            <span>
              {jtString(
                c('B7.FilesSubscriptionHelp.Subscription.Info')
                  .jt`To take advantage of ${featureNameBold} and other advanced features, upgrade your current plan.`,
              )}
            </span>
          )}
          {!featureNameBold && (
            <span>
              {c('B7.FilesSubscriptionHelp.Subscription.Info')
                .t`To take advantage of all the advanced features Standard Notes has to offer, upgrade your current plan.`}
            </span>
          )}
          {application.isNativeIOS() && (
            <div className="mt-2">
              <div className="mb-2 font-bold">
                {jtString(
                  c('B7.FilesSubscriptionHelp.Subscription.Info')
                    .jt`The ${ProfessionalPlanName} Plan costs $119.99/year and includes benefits like`,
                )}
              </div>
              <ul className="list-inside list-[circle]">
                <li>{c('B7.FilesSubscriptionHelp.Subscription.Info').t`100GB encrypted file storage`}</li>
                <li>
                  {jtString(
                    c('B7.FilesSubscriptionHelp.Subscription.Info')
                      .jt`Access to all note types, including ${SuperName}, ${MarkdownEditorName}, ${RichTextEditorName}, ${AuthenticatorName}, ${ChecklistEditorName}, and ${SpreadsheetName}`,
                  )}
                </li>
                <li>{c('B7.FilesSubscriptionHelp.Subscription.Info')
                  .t`Access to Daily Notebooks and Moments journals`}</li>
                <li>{c('B7.FilesSubscriptionHelp.Subscription.Info').t`Note history going back indefinitely`}</li>
                <li>{c('B7.FilesSubscriptionHelp.Subscription.Info').t`Nested folders for your tags`}</li>
                <li>{c('B7.FilesSubscriptionHelp.Subscription.Info').t`Premium support`}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      {application.canShowPurchaseFlow() && (
        <button
          onClick={handleClick}
          className={classNames(
            'no-border cursor-pointer rounded bg-info py-2 font-bold text-info-contrast hover:brightness-125 focus:brightness-125',
            preferHorizontalLayout ? 'w-full px-4 md:ml-auto md:w-auto' : 'my-2 w-full',
          )}
          ref={ctaRef}
        >
          {c('B7.FilesSubscriptionHelp.Subscription.Action').t`Upgrade`}
        </button>
      )}
    </div>
  )
}
