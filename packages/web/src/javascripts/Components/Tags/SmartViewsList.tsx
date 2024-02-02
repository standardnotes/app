import { FeaturesController } from '@/Controllers/FeaturesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { SmartView } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useState } from 'react'
import SmartViewsListItem from './SmartViewsListItem'
import { useListKeyboardNavigation } from '@/Hooks/useListKeyboardNavigation'

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

  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  useListKeyboardNavigation(container, {
    initialFocus: 0,
    shouldAutoFocus: false,
    shouldWrapAround: false,
    resetLastFocusedOnBlur: true,
  })

  if (allViews.length === 0 && navigationController.isSearching) {
    return (
      <div className="px-4 py-1 text-base opacity-60 lg:text-sm">No smart views found. Try a different search.</div>
    )
  }

  return (
    <div ref={setContainer}>
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
    </div>
  )
}

export default observer(SmartViewsList)
