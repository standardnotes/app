import {
  AlertService,
  LegacyApiServiceInterface,
  MobileDeviceInterface,
  SessionsClientInterface,
  SubscriptionManagerInterface,
} from '@standardnotes/services'
import { LoggingDomain, log } from '@/Logging'
import { AppleIAPProductId, InternalEventBusInterface } from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { PurchaseFlowPane } from './PurchaseFlowPane'
import { LoadPurchaseFlowUrl } from '@/Application/UseCase/LoadPurchaseFlowUrl'
import { IsNativeIOS } from '@standardnotes/ui-services'

export class PurchaseFlowController extends AbstractViewController {
  isOpen = false
  currentPane = PurchaseFlowPane.CreateAccount

  constructor(
    private sessions: SessionsClientInterface,
    private subscriptions: SubscriptionManagerInterface,
    private legacyApi: LegacyApiServiceInterface,
    private alerts: AlertService,
    private mobileDevice: MobileDeviceInterface | undefined,
    private _loadPurchaseFlowUrl: LoadPurchaseFlowUrl,
    private _isNativeIOS: IsNativeIOS,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

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

  openPurchaseFlow = async (plan = AppleIAPProductId.ProPlanYearly) => {
    const user = this.sessions.getUser()
    if (!user) {
      this.isOpen = true
      return
    }

    if (this._isNativeIOS.execute().getValue()) {
      await this.beginIosIapPurchaseFlow(plan)
    } else {
      await this._loadPurchaseFlowUrl.execute()
    }
  }

  openPurchaseWebpage = async () => {
    const result = await this._loadPurchaseFlowUrl.execute()
    if (result.isFailed()) {
      console.error(result.getError())
      void this.alerts.alert(result.getError())
    }
  }

  beginIosIapPurchaseFlow = async (plan: AppleIAPProductId): Promise<void> => {
    const result = await this.mobileDevice?.purchaseSubscriptionIAP(plan)

    log(LoggingDomain.Purchasing, 'BeginIosIapPurchaseFlow result', result)

    if (!result) {
      void this.alerts.alert('Your purchase was canceled or failed. Please try again.')
      return
    }

    const showGenericError = () => {
      void this.alerts.alert(
        'There was an error confirming your purchase. Please contact support at help@standardnotes.com.',
      )
    }

    log(LoggingDomain.Purchasing, 'Confirming result with our server')

    const token = await this.legacyApi.getNewSubscriptionToken()

    if (!token) {
      log(LoggingDomain.Purchasing, 'Unable to generate subscription token')
      showGenericError()
      return
    }

    const confirmResult = await this.subscriptions.confirmAppleIAP(result, token)

    log(LoggingDomain.Purchasing, 'Server confirm result', confirmResult)

    if (confirmResult) {
      void this.alerts.alert(
        'Please allow a few minutes for your subscription benefits to activate. You will see a confirmation alert in the app when your subscription is ready.',
        'Your purchase was successful!',
      )
    } else {
      showGenericError()
    }
  }

  closePurchaseFlow = (): void => {
    this.isOpen = false
  }
}
