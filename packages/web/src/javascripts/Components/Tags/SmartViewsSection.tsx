import { WebApplication } from '@/Application/WebApplication'
import { SMART_TAGS_FEATURE_NAME } from '@/Constants/Constants'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useMemo } from 'react'
import IconButton from '../Button/IconButton'
import EditSmartViewModal from '../Preferences/Panes/General/SmartViews/EditSmartViewModal'
import { EditSmartViewModalController } from '../Preferences/Panes/General/SmartViews/EditSmartViewModalController'
import ModalOverlay from '../Modal/ModalOverlay'
import AddSmartViewModal from '../SmartViewBuilder/AddSmartViewModal'
import { AddSmartViewModalController } from '../SmartViewBuilder/AddSmartViewModalController'
import SmartViewsList from './SmartViewsList'

type Props = {
  application: WebApplication
  navigationController: NavigationController
  featuresController: FeaturesController
}

const SmartViewsSection: FunctionComponent<Props> = ({ application, navigationController, featuresController }) => {
  const premiumModal = usePremiumModal()
  const addSmartViewModalController = useMemo(() => new AddSmartViewModalController(application), [application])
  const editSmartViewModalController = useMemo(() => new EditSmartViewModalController(application), [application])

  const createNewSmartView = useCallback(() => {
    if (!featuresController.hasSmartViews) {
      premiumModal.activate(SMART_TAGS_FEATURE_NAME)
      return
    }

    addSmartViewModalController.setIsAddingSmartView(true)
  }, [addSmartViewModalController, premiumModal, featuresController.hasSmartViews])

  return (
    <section>
      <div className={'section-title-bar'}>
        <div className="section-title-bar-header">
          <div className="title text-base md:text-sm">
            <span className="font-bold">Views</span>
          </div>
          {!navigationController.isSearching && (
            <IconButton
              focusable={true}
              icon="add"
              title="Create a new smart view"
              className="p-0 text-neutral"
              onClick={createNewSmartView}
            />
          )}
        </div>
      </div>
      <SmartViewsList
        navigationController={navigationController}
        featuresController={featuresController}
        setEditingSmartView={editSmartViewModalController.setView}
      />
      <ModalOverlay isOpen={!!editSmartViewModalController.view} close={editSmartViewModalController.closeDialog}>
        <EditSmartViewModal controller={editSmartViewModalController} platform={application.platform} />
      </ModalOverlay>
      <ModalOverlay
        isOpen={addSmartViewModalController.isAddingSmartView}
        close={addSmartViewModalController.closeModal}
      >
        <AddSmartViewModal controller={addSmartViewModalController} platform={application.platform} />
      </ModalOverlay>
    </section>
  )
}

export default observer(SmartViewsSection)
