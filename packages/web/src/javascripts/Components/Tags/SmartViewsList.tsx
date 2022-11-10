import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { SmartView } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import SmartViewsListItem from './SmartViewsListItem'

type Props = {
  viewControllerManager: ViewControllerManager
  setEditingSmartView: (smartView: SmartView) => void
}

const SmartViewsList: FunctionComponent<Props> = ({ viewControllerManager, setEditingSmartView }: Props) => {
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
            setEditingSmartView={setEditingSmartView}
          />
        )
      })}
    </>
  )
}

export default observer(SmartViewsList)
