import { WebApplication } from '@/Application/Application'
import Button from '@/Components/Button/Button'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { isSystemView, SmartView } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'
import { Title } from '../../../PreferencesComponents/Content'
import PreferencesGroup from '../../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import AddSmartViewModal from '@/Components/SmartViewBuilder/AddSmartViewModal'
import { AddSmartViewModalController } from '@/Components/SmartViewBuilder/AddSmartViewModalController'
import EditSmartViewModal from './EditSmartViewModal'
import SmartViewItem from './SmartViewItem'

type Props = {
  application: WebApplication
  navigationController: NavigationController
}

const SmartViews = ({ application, navigationController }: Props) => {
  const [editingSmartView, setEditingSmartView] = useState<SmartView | undefined>(undefined)

  const addSmartViewModalController = useMemo(() => new AddSmartViewModalController(application), [application])

  const nonSystemSmartViews = navigationController.smartViews.filter((view) => !isSystemView(view))

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
                onDelete={() => navigationController.remove(view, true)}
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
          navigationController={navigationController}
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
