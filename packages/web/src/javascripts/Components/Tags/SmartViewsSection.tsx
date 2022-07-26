import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import SmartViewsList from './SmartViewsList'

type Props = {
  viewControllerManager: ViewControllerManager
  showTitles: boolean
}

const SmartViewsSection: FunctionComponent<Props> = ({ viewControllerManager, showTitles }) => {
  return (
    <section>
      <SmartViewsList viewControllerManager={viewControllerManager} showTitles={showTitles} />
    </section>
  )
}

export default observer(SmartViewsSection)
