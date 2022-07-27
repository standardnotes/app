import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import SmartViewsList from './SmartViewsList'

type Props = {
  viewControllerManager: ViewControllerManager
  isCollapsed: boolean
}

const SmartViewsSection: FunctionComponent<Props> = ({ viewControllerManager, isCollapsed }) => {
  return (
    <section>
      <SmartViewsList viewControllerManager={viewControllerManager} isCollapsed={isCollapsed} />
    </section>
  )
}

export default observer(SmartViewsSection)
