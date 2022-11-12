import { LoggingDomain, log } from '@/Logging'
import { loadPurchaseFlowUrl } from '@/Components/PurchaseFlow/PurchaseFlowFunctions'
import { InternalEventBus, AppleIAPProductId } from '@standardnotes/snjs'
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

  openPurchaseFlow = (plan = AppleIAPProductId.ProPlanYearly): void => {
    const user = this.application.getUser()
    if (!user) {
      this.isOpen = true
      return
    }

    if (this.application.isNativeIOS()) {
      void this.beginIosIapPurchaseFlow(plan)
    } else {
      loadPurchaseFlowUrl(this.application).catch(console.error)
    }
  }

  openPurchaseWebpage = () => {
    loadPurchaseFlowUrl(this.application).catch((err) => {
      console.error(err)
      this.application.alertService.alert(err).catch(console.error)
    })
  }

  beginIosIapPurchaseFlow = async (plan: AppleIAPProductId): Promise<void> => {
    const result = await this.application.mobileDevice().purchaseSubscriptionIAP(plan)

    log(LoggingDomain.Purchasing, 'BeginIosIapPurchaseFlow result', result)

    if (!result) {
      void this.application.alertService.alert('Your purchase was canceled or failed. Please try again.')
      return
    }

    const showGenericError = () => {
      void this.application.alertService.alert(
        'There was an error confirming your purchase. Please contact support at help@standardnotes.com.',
      )
    }

    log(LoggingDomain.Purchasing, 'Confirming result with our server')

    const token = await this.application.getNewSubscriptionToken()

    if (!token) {
      log(LoggingDomain.Purchasing, 'Unable to generate subscription token')
      showGenericError()
      return
    }

    const confirmResult = await this.application.subscriptions.confirmAppleIAP(result, token)

    log(LoggingDomain.Purchasing, 'Server confirm result', confirmResult)

    if (!confirmResult) {
      showGenericError()
    }
  }

  closePurchaseFlow = (): void => {
    this.isOpen = false
  }
}
