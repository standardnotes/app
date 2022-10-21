import { RouteServiceInterface, RouteType } from '@standardnotes/ui-services'
import { ApplicationEvent, SessionsClientInterface, SyncClientInterface } from '@standardnotes/snjs'

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
                this.accountMenuController.setShow(true)
                this.accountMenuController.setCurrentPane(AccountMenuPane.SignIn)

                break
              }

              this.preferencesController.openPreferences()
              this.preferencesController.setCurrentPane(route.settingsParams.panel)
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
          }
        }
        break
      case ApplicationEvent.SyncStatusChanged:
        this.syncStatusController.update(this.syncClient.getSyncStatus())
        break
    }
  }
}
