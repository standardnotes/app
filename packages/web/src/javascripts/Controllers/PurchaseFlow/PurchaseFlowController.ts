import { loadPurchaseFlowUrl } from '@/Components/PurchaseFlow/PurchaseFlowFunctions'
import { InternalEventBus } from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'
import { WebApplication } from '../../Application/Application'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { PurchaseFlowPane } from './PurchaseFlowPane'

export class PurchaseFlowController extends AbstractViewController {
  isOpen = false
  currentPane = PurchaseFlowPane.CreateAccount

  constructor(application: WebApplication, eventBus: InternalEventBus) {
    super(application, eventBus)

    makeObservable(this, {
      isOpen: observable,
      currentPane: observable,

      setCurrentPane: action,
      openPurchaseFlow: action,
      closePurchaseFlow: action,
    })
  }

  setCurrentPane = (currentPane: PurchaseFlowPane): void => {
    this.currentPane = currentPane
  }

  openPurchaseFlow = (): void => {
    const user = this.application.getUser()
    if (!user) {
      this.isOpen = true
    } else {
      loadPurchaseFlowUrl(this.application).catch(console.error)
    }
  }

  closePurchaseFlow = (): void => {
    this.isOpen = false
  }
}
