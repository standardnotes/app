import { WebApplication } from '@/Application/WebApplication'
import Button from '@/Components/Button/Button'
import { ContentType, isSystemView, SmartView } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { STRING_DELETE_TAG } from '@/Constants/Strings'
import { confirmDialog } from '@standardnotes/ui-services'
import ModalOverlay from '@/Components/Modal/ModalOverlay'

type NewType = {
  application: WebApplication
  featuresController: FeaturesController
}

type Props = NewType

const SmartViews = ({ application, featuresController }: Props) => {
  const addSmartViewModalController = useMemo(() => new AddSmartViewModalController(application), [application])
  const editSmartViewModalController = useMemo(() => new EditSmartViewModalController(application), [application])

  const [smartViews, setSmartViews] = useState(() =>
    application.items.getSmartViews().filter((view) => !isSystemView(view)),
  )

  useEffect(() => {
    const disposeItemStream = application.items.streamItems([ContentType.TYPES.SmartView], () => {
      setSmartViews(application.items.getSmartViews().filter((view) => !isSystemView(view)))
    })

    return disposeItemStream
  }, [application])

  const deleteItem = useCallback(
    async (view: SmartView) => {
      const shouldDelete = await confirmDialog({
        text: STRING_DELETE_TAG,
        confirmButtonStyle: 'danger',
      })
      if (shouldDelete) {
        application.mutator
          .deleteItem(view)
          .then(() => application.sync.sync())
          .catch(console.error)
      }
    },
    [application.mutator, application.sync],
  )

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
                {smartViews.map((view) => (
                  <SmartViewItem
                    key={view.uuid}
                    view={view}
                    onEdit={() => editSmartViewModalController.setView(view)}
                    onDelete={deleteItem}
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
      <ModalOverlay isOpen={!!editSmartViewModalController.view} close={editSmartViewModalController.closeDialog}>
        <EditSmartViewModal controller={editSmartViewModalController} platform={application.platform} />
      </ModalOverlay>
      <ModalOverlay
        isOpen={addSmartViewModalController.isAddingSmartView}
        close={addSmartViewModalController.closeModal}
      >
        <AddSmartViewModal controller={addSmartViewModalController} platform={application.platform} />
      </ModalOverlay>
    </>
  )
}

export default observer(SmartViews)
