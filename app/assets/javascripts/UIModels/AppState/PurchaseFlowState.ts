import { loadPurchaseFlowUrl } from '@/Components/PurchaseFlow/PurchaseFlowWrapper'
import { action, makeObservable, observable } from 'mobx'
import { WebApplication } from '../Application'
import { AbstractState } from './AbstractState'

export enum PurchaseFlowPane {
  SignIn,
  CreateAccount,
}

export class PurchaseFlowState extends AbstractState {
  isOpen = false
  currentPane = PurchaseFlowPane.CreateAccount

  constructor(application: WebApplication) {
    super(application)

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
