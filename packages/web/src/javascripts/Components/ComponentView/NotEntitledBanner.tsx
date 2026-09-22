import { AnyFeatureDescription, FeatureStatus } from '@standardnotes/snjs'
import { FunctionComponent, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { c } from 'ttag'

const jtString = (value: unknown): string => (Array.isArray(value) ? value.join('') : String(value))
import Button from '@/Components/Button/Button'
import { WarningCircle } from '../UIElements/WarningCircle'
import { useApplication } from '../ApplicationProvider'
import { localizationStore } from '@/Controllers/Localization/LocalizationStore'
import { formatLastSyncDate } from '@/Utils/LocalizedDateFormat'

type Props = {
  feature: AnyFeatureDescription
  featureStatus: FeatureStatus
}

const NotEntitledBanner: FunctionComponent<Props> = ({ featureStatus, feature }) => {
  void localizationStore.currentLocale

  const application = useApplication()

  const expiredDate = application.subscriptions.userSubscriptionExpirationDate

  const statusString = () => {
    switch (featureStatus) {
      case FeatureStatus.InCurrentPlanButExpired:
        if (expiredDate) {
          const expiredDateString = formatLastSyncDate(expiredDate)
          return jtString(
            c('B7.FilesSubscriptionHelp.Subscription.Info').jt`Your subscription expired on ${expiredDateString}`,
          )
        } else {
          return c('B7.FilesSubscriptionHelp.Subscription.Info').t`Your subscription expired.`
        }
      case FeatureStatus.NoUserSubscription:
        return c('B7.FilesSubscriptionHelp.Subscription.Info').t`You do not have an active subscription`
      case FeatureStatus.NotInCurrentPlan: {
        const featureNameLabel = feature.name
        return jtString(
          c('B7.FilesSubscriptionHelp.Subscription.Info').jt`Please upgrade your plan to access ${featureNameLabel}`,
        )
      }
      default: {
        const featureNameLabel = feature.name
        return jtString(
          c('B7.FilesSubscriptionHelp.Subscription.Info')
            .jt`${featureNameLabel} is valid and you should not be seeing this message`,
        )
      }
    }
  }

  const manageSubscription = useCallback(() => {
    void application.openSubscriptionDashboard.execute()
  }, [application])

  return (
    <div className={'sn-component'}>
      <div className="flex min-h-[1.625rem] w-full select-none items-center justify-between border-b border-border bg-contrast px-2 py-2.5 text-text">
        <div className={'left'}>
          <div className="flex items-start">
            <div className="mt-1">
              <WarningCircle />
            </div>
            <div className="ml-2">
              <strong>{statusString()}</strong>
              <div className={'sk-p'}>
                {jtString(c('B7.FilesSubscriptionHelp.Subscription.Info').jt`${feature.name} is in a read-only state.`)}
              </div>
            </div>
          </div>
        </div>
        <div className={'right'}>
          {application.canShowPurchaseFlow() && (
            <Button onClick={manageSubscription} primary colorStyle="success" small>
              {c('B7.FilesSubscriptionHelp.Subscription.Label').t`Manage subscription`}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default observer(NotEntitledBanner)
