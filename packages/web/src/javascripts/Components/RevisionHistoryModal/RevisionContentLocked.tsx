import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { HistoryLockedIllustration } from '@standardnotes/icons'
import Button from '@/Components/Button/Button'
import { useApplication } from '../ApplicationProvider'

const getPlanHistoryDuration = (planName: string | undefined) => {
  switch (planName) {
    case 'Core':
      return '30 days'
    case 'Plus':
      return '365 days'
    default:
      return "the current session's changes"
  }
}

const getPremiumContentCopy = (planName: string | undefined) => {
  return `Version history is limited to ${getPlanHistoryDuration(planName)} in the ${planName} plan`
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
        <div className="mb-1 mt-2 text-lg font-bold">Can't access this version</div>
        <div className="leading-140% mb-4 text-passive-0">
          {getPremiumContentCopy(planName)}. Learn more about our other plans to upgrade your history capacity.
        </div>
        <Button
          primary
          label="Discover plans"
          onClick={() => {
            if (window.plansUrl) {
              window.location.assign(window.plansUrl)
            }
          }}
        />
      </div>
    </div>
  )
}

export default observer(RevisionContentLocked)
