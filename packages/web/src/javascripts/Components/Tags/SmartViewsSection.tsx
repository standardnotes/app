import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import SmartViewsList from './SmartViewsList'

type Props = {
  viewControllerManager: ViewControllerManager
}

const SmartViewsSection: FunctionComponent<Props> = ({ viewControllerManager }) => {
  return (
    <section>
      <SmartViewsList viewControllerManager={viewControllerManager} />
    </section>
  )
}

export default observer(SmartViewsSection)
