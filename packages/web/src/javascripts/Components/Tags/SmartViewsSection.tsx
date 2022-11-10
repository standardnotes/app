import { WebApplication } from '@/Application/Application'
import { SMART_TAGS_FEATURE_NAME } from '@/Constants/Constants'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { SmartView } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import IconButton from '../Button/IconButton'
import EditSmartViewModal from '../Preferences/Panes/General/SmartViews/EditSmartViewModal'
import AddSmartViewModal from '../SmartViewBuilder/AddSmartViewModal'
import { AddSmartViewModalController } from '../SmartViewBuilder/AddSmartViewModalController'
import SmartViewsList from './SmartViewsList'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const SmartViewsSection: FunctionComponent<Props> = ({ application, viewControllerManager }) => {
  const premiumModal = usePremiumModal()
  const addSmartViewModalController = useMemo(() => new AddSmartViewModalController(application), [application])

  const [editingSmartView, setEditingSmartView] = useState<SmartView | undefined>(undefined)

  const createNewSmartView = useCallback(() => {
    if (!viewControllerManager.featuresController.hasSmartViews) {
      premiumModal.activate(SMART_TAGS_FEATURE_NAME)
      return
    }

    addSmartViewModalController.setIsAddingSmartView(true)
  }, [addSmartViewModalController, premiumModal, viewControllerManager.featuresController.hasSmartViews])

  return (
    <section>
      <div className={'section-title-bar'}>
        <div className="section-title-bar-header">
          <div className="title text-base md:text-sm">
            <span className="font-bold">Views</span>
          </div>
          <IconButton
            focusable={true}
            icon="add"
            title="Create a new smart view"
            className="p-0 text-neutral"
            onClick={createNewSmartView}
          />
        </div>
      </div>
      <SmartViewsList viewControllerManager={viewControllerManager} setEditingSmartView={setEditingSmartView} />
      {!!editingSmartView && (
        <EditSmartViewModal
          application={application}
          navigationController={viewControllerManager.navigationController}
          view={editingSmartView}
          closeDialog={() => {
            setEditingSmartView(undefined)
          }}
        />
      )}
      {addSmartViewModalController.isAddingSmartView && (
        <AddSmartViewModal controller={addSmartViewModalController} platform={application.platform} />
      )}
    </section>
  )
}

export default observer(SmartViewsSection)
