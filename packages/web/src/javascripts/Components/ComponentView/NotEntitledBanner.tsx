import { AnyFeatureDescription, FeatureStatus, dateToLocalizedString } from '@standardnotes/snjs'
import { FunctionComponent, useCallback } from 'react'
import Button from '@/Components/Button/Button'
import { WarningCircle } from '../UIElements/WarningCircle'
import { useApplication } from '../ApplicationProvider'

type Props = {
  feature: AnyFeatureDescription
  featureStatus: FeatureStatus
}

const statusString = (featureStatus: FeatureStatus, expiredDate: Date | undefined, featureName: string) => {
  switch (featureStatus) {
    case FeatureStatus.InCurrentPlanButExpired:
      if (expiredDate) {
        return `Your subscription expired on ${dateToLocalizedString(expiredDate)}`
      } else {
        return 'Your subscription expired.'
      }
    case FeatureStatus.NoUserSubscription:
      return 'You do not have an active subscription'
    case FeatureStatus.NotInCurrentPlan:
      return `Please upgrade your plan to access ${featureName}`
    default:
      return `${featureName} is valid and you should not be seeing this message`
  }
}

const NotEntitledBanner: FunctionComponent<Props> = ({ featureStatus, feature }) => {
  const application = useApplication()

  const expiredDate = application.subscriptions.userSubscriptionExpirationDate

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
              <strong>{statusString(featureStatus, expiredDate, feature.name)}</strong>
              <div className={'sk-p'}>{feature.name} is in a read-only state.</div>
            </div>
          </div>
        </div>
        <div className={'right'}>
          <Button onClick={manageSubscription} primary colorStyle="success" small>
            Manage subscription
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotEntitledBanner
