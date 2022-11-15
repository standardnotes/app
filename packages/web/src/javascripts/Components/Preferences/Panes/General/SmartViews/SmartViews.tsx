import { WebApplication } from '@/Application/Application'
import Button from '@/Components/Button/Button'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { isSystemView } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { Title } from '../../../PreferencesComponents/Content'
import PreferencesGroup from '../../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import AddSmartViewModal from '@/Components/SmartViewBuilder/AddSmartViewModal'
import { AddSmartViewModalController } from '@/Components/SmartViewBuilder/AddSmartViewModalController'
import EditSmartViewModal from './EditSmartViewModal'
import SmartViewItem from './SmartViewItem'
import { FeaturesController } from '@/Controllers/FeaturesController'
import NoSubscriptionBanner from '@/Components/NoSubscriptionBanner/NoSubscriptionBanner'
import { EditSmartViewModalController } from './EditSmartViewModalController'

type NewType = {
  application: WebApplication
  navigationController: NavigationController
  featuresController: FeaturesController
}

type Props = NewType

const SmartViews = ({ application, navigationController, featuresController }: Props) => {
  const addSmartViewModalController = useMemo(() => new AddSmartViewModalController(application), [application])
  const editSmartViewModalController = useMemo(
    () => new EditSmartViewModalController(application, navigationController),
    [application, navigationController],
  )

  const nonSystemSmartViews = navigationController.smartViews.filter((view) => !isSystemView(view))

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Smart Views</Title>
          {!featuresController.hasSmartViews && (
            <NoSubscriptionBanner
              className="mt-2"
              application={application}
              title="Upgrade for smart views"
              message="Create smart views to organize your notes according to conditions you define."
            />
          )}
          {featuresController.hasSmartViews && (
            <>
              <div className="my-2 flex flex-col">
                {nonSystemSmartViews.map((view) => (
                  <SmartViewItem
                    key={view.uuid}
                    view={view}
                    onEdit={() => editSmartViewModalController.setView(view)}
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
            </>
          )}
        </PreferencesSegment>
      </PreferencesGroup>
      {!!editSmartViewModalController.view && (
        <EditSmartViewModal controller={editSmartViewModalController} platform={application.platform} />
      )}
      {addSmartViewModalController.isAddingSmartView && (
        <AddSmartViewModal controller={addSmartViewModalController} platform={application.platform} />
      )}
    </>
  )
}

export default observer(SmartViews)
