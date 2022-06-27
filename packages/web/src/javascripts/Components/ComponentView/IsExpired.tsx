import { FeatureStatus } from '@standardnotes/snjs'
import { FunctionComponent } from 'react'
import Button from '@/Components/Button/Button'
import IndicatorCircle from '../IndicatorCircle/IndicatorCircle'

type Props = {
  expiredDate: string
  componentName: string
  featureStatus: FeatureStatus
  manageSubscription: () => void
}

const statusString = (featureStatus: FeatureStatus, expiredDate: string, componentName: string) => {
  switch (featureStatus) {
    case FeatureStatus.InCurrentPlanButExpired:
      return `Your subscription expired on ${expiredDate}`
    case FeatureStatus.NoUserSubscription:
      return 'You do not have an active subscription'
    case FeatureStatus.NotInCurrentPlan:
      return `Please upgrade your plan to access ${componentName}`
    default:
      return `${componentName} is valid and you should not be seeing this message`
  }
}

const IsExpired: FunctionComponent<Props> = ({ expiredDate, featureStatus, componentName, manageSubscription }) => {
  return (
    <div className={'sn-component'}>
      <div className="flex justify-between items-center w-full min-h-[1.625rem] py-2.5 px-2 bg-contrast text-text border-b border-border select-none">
        <div className={'left'}>
          <div className="flex items-center">
            <IndicatorCircle style="danger" />
            <div className="ml-2">
              <strong>{statusString(featureStatus, expiredDate, componentName)}</strong>
              <div className={'sk-p'}>{componentName} is in a read-only state.</div>
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

export default IsExpired
