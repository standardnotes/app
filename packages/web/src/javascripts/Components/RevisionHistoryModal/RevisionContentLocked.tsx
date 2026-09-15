import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { HistoryLockedIllustration } from '@standardnotes/icons'
import Button from '@/Components/Button/Button'
import { useApplication } from '../ApplicationProvider'
import { CorePlanName, PlusPlanName } from '@standardnotes/features'
import { c } from 'ttag'

const getPlanHistoryDuration = (planName: string | undefined) => {
  switch (planName) {
    case CorePlanName:
      return c('B4.Notes.History.Label').t`30 days`
    case PlusPlanName:
      return c('B4.Notes.History.Label').t`365 days`
    default:
      return c('B4.Notes.History.Label').t`the current session's changes`
  }
}

const getPremiumContentCopy = (planName: string | undefined) => {
  const duration = getPlanHistoryDuration(planName)
  const plan = planName ?? c('B4.Notes.History.Label').t`free`
  return c('B4.Notes.History.Label').jt`Version history is limited to ${duration} in the ${plan} plan`
}

const RevisionContentLocked: FunctionComponent = () => {
  const application = useApplication()

  let planName = 'free'
  if (application.subscriptions.hasOnlineSubscription()) {
    if (!application.subscriptions.isUserSubscriptionCanceled && !application.subscriptions.isUserSubscriptionExpired) {
      planName = application.subscriptions.userSubscriptionName
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="max-w-40% flex flex-col items-center px-8 text-center">
        <HistoryLockedIllustration />
        <div className="mb-1 mt-2 text-lg font-bold">{c('B4.Notes.History.Label').t`Can't access this version`}</div>
        <div className="leading-140% mb-4 text-passive-0">
          {getPremiumContentCopy(planName)}.{' '}
          {c('B4.Notes.History.Label').t`Learn more about our other plans to upgrade your history capacity.`}
        </div>
        {application.canShowPurchaseFlow() && (
          <Button
            primary
            label={c('B4.Notes.History.Action').t`Discover plans`}
            onClick={() => {
              if (window.plansUrl) {
                window.location.assign(window.plansUrl)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

export default observer(RevisionContentLocked)
