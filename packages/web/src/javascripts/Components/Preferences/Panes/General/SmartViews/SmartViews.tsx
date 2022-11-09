import { WebApplication } from '@/Application/Application'
import Button from '@/Components/Button/Button'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { isSystemView, SmartView } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'
import { Title } from '../../../PreferencesComponents/Content'
import PreferencesGroup from '../../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import AddSmartViewModal from './AddSmartViewModal'
import { AddSmartViewModalController } from './AddSmartViewModalController'
import EditSmartViewModal from './EditSmartViewModal'
import SmartViewItem from './SmartViewItem'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const SmartViews = ({ application, viewControllerManager }: Props) => {
  const [editingSmartView, setEditingSmartView] = useState<SmartView | undefined>(undefined)

  const addSmartViewModalController = useMemo(() => new AddSmartViewModalController(application), [application])

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
              addSmartViewModalController.setIsAddingSmartView(true)
            }}
          >
            Create Smart View
          </Button>
        </PreferencesSegment>
      </PreferencesGroup>
      {!!editingSmartView && (
        <EditSmartViewModal
          application={application}
          view={editingSmartView}
          closeDialog={() => {
            setEditingSmartView(undefined)
          }}
        />
      )}
      {addSmartViewModalController.isAddingSmartView && (
        <AddSmartViewModal controller={addSmartViewModalController} platform={application.platform} />
      )}
    </>
  )
}

export default observer(SmartViews)
