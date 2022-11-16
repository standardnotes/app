import { FeaturesController } from '@/Controllers/FeaturesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { SmartView } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import SmartViewsListItem from './SmartViewsListItem'

type Props = {
  navigationController: NavigationController
  featuresController: FeaturesController
  setEditingSmartView: (smartView: SmartView) => void
}

const SmartViewsList: FunctionComponent<Props> = ({
  navigationController,
  featuresController,
  setEditingSmartView,
}: Props) => {
  const allViews = navigationController.smartViews

  return (
    <>
      {allViews.map((view) => {
        return (
          <SmartViewsListItem
            key={view.uuid}
            view={view}
            tagsState={navigationController}
            features={featuresController}
            setEditingSmartView={setEditingSmartView}
          />
        )
      })}
    </>
  )
}

export default observer(SmartViewsList)
