import { WebApplication } from '@/Application/Application'
import Button from '@/Components/Button/Button'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { isSystemView, SmartView, SNTag } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Title } from '../../../PreferencesComponents/Content'
import PreferencesGroup from '../../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import EditSmartViewModal from './EditSmartViewModal'
import SmartViewItem from './SmartViewItem'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const SmartViews = ({ application, viewControllerManager }: Props) => {
  const [editingSmartView, setEditingSmartView] = useState<SmartView | SNTag | undefined>(undefined)

  const nonSystemSmartViews = viewControllerManager.navigationController.smartViews.filter(
    (view) => !isSystemView(view),
  )

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Smart Views</Title>
          <div className="my-2 flex flex-col">
            {nonSystemSmartViews.map((view) => (
              <SmartViewItem
                key={view.uuid}
                view={view}
                onEdit={() => setEditingSmartView(view)}
                onDelete={() => viewControllerManager.navigationController.remove(view, true)}
              />
            ))}
          </div>
          <Button
            onClick={() => {
              const view = viewControllerManager.navigationController.createNewTemplate()
              if (!view) {
                return
              }
              setEditingSmartView(view)
            }}
          >
            Create Smart View
          </Button>
        </PreferencesSegment>
      </PreferencesGroup>
      {!!editingSmartView && (
        <EditSmartViewModal
          application={application}
          featuresController={viewControllerManager.featuresController}
          view={editingSmartView}
          closeDialog={() => {
            setEditingSmartView(undefined)
          }}
        />
      )}
    </>
  )
}

export default observer(SmartViews)
