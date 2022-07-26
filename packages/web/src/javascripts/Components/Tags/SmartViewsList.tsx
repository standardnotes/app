import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import SmartViewsListItem from './SmartViewsListItem'

type Props = {
  viewControllerManager: ViewControllerManager
  showTitles: boolean
}

const SmartViewsList: FunctionComponent<Props> = ({ viewControllerManager, showTitles }: Props) => {
  const allViews = viewControllerManager.navigationController.smartViews

  return (
    <>
      {allViews.map((view) => {
        return (
          <SmartViewsListItem
            key={view.uuid}
            view={view}
            tagsState={viewControllerManager.navigationController}
            features={viewControllerManager.featuresController}
            showTitles={showTitles}
          />
        )
      })}
    </>
  )
}

export default observer(SmartViewsList)
