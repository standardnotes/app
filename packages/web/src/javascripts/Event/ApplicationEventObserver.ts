import { RootQueryParam, RouteParserInterface, RouteServiceInterface, RouteType, ToastServiceInterface } from '@standardnotes/ui-services'
import {
  ApplicationEvent,
  SessionsClientInterface,
  SubscriptionClientInterface,
  SyncClientInterface,
} from '@standardnotes/snjs'
import { ToastType } from '@standardnotes/toast'

import { PurchaseFlowController } from '@/Controllers/PurchaseFlow/PurchaseFlowController'
import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { PreferencesController } from '@/Controllers/PreferencesController'
import { SyncStatusController } from '@/Controllers/SyncStatusController'
import { AccountMenuPane } from '@/Components/AccountMenu/AccountMenuPane'

import { EventObserverInterface } from './EventObserverInterface'

export class ApplicationEventObserver implements EventObserverInterface {
  constructor(
    private routeService: RouteServiceInterface,
    private purchaseFlowController: PurchaseFlowController,
    private accountMenuController: AccountMenuController,
    private preferencesController: PreferencesController,
    private syncStatusController: SyncStatusController,
    private syncClient: SyncClientInterface,
    private sessionManager: SessionsClientInterface,
    private subscriptionManager: SubscriptionClientInterface,
    private toastService: ToastServiceInterface,
  ) {}

  async handle(event: ApplicationEvent): Promise<void> {
    switch (event) {
      case ApplicationEvent.Launched:
        {
          const route = this.routeService.getRoute()
          switch (route.type) {
            case RouteType.Purchase:
              this.purchaseFlowController.openPurchaseFlow()

              break
            case RouteType.Settings: {
              const user = this.sessionManager.getUser()
              if (user === undefined) {
                this.promptUserSignIn()

                break
              }

              this.preferencesController.openPreferences()
              this.preferencesController.setCurrentPane(route.settingsParams.panel)
              break
            }
            case RouteType.AcceptSubscriptionInvite: {
              const user = this.sessionManager.getUser()
              if (user === undefined) {
                this.promptUserSignIn()

                break
              }
              await this.acceptSubscriptionInvitation(route)

              break
            }
          }
        }
        break
      case ApplicationEvent.SignedIn:
        {
          const route = this.routeService.getRoute()
          switch (route.type) {
            case RouteType.Settings:
              this.preferencesController.openPreferences()
              this.preferencesController.setCurrentPane(route.settingsParams.panel)

              break
            case RouteType.AcceptSubscriptionInvite:
              await this.acceptSubscriptionInvitation(route)

              break
          }
        }
        break
      case ApplicationEvent.SyncStatusChanged:
        this.syncStatusController.update(this.syncClient.getSyncStatus())
        break
    }
  }

  private promptUserSignIn(): void {
    this.accountMenuController.setShow(true)
    this.accountMenuController.setCurrentPane(AccountMenuPane.SignIn)
  }

  private async acceptSubscriptionInvitation(route: RouteParserInterface): Promise<void> {
    const acceptResult = await this.subscriptionManager.acceptInvitation(route.subscriptionInviteParams.inviteUuid)

    const toastType = acceptResult.success ? ToastType.Success : ToastType.Error
    const toastMessage = acceptResult.success ? 'Successfully joined a shared subscription' : acceptResult.message

    this.toastService.showToast(toastType, toastMessage)

    this.routeService.removeQueryParameterFromURL(RootQueryParam.AcceptSubscriptionInvite)
  }
}
