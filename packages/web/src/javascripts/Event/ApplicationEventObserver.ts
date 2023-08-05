import {
  RootQueryParam,
  RouteParserInterface,
  RouteServiceInterface,
  RouteType,
  ToastServiceInterface,
  WebApplicationInterface,
} from '@standardnotes/ui-services'
import {
  ApplicationEvent,
  SessionsClientInterface,
  SubscriptionManagerInterface,
  SyncServiceInterface,
  UserServiceInterface,
} from '@standardnotes/snjs'
import { ToastType } from '@standardnotes/toast'

import { PurchaseFlowController } from '@/Controllers/PurchaseFlow/PurchaseFlowController'
import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { PreferencesController } from '@/Controllers/PreferencesController'
import { SyncStatusController } from '@/Controllers/SyncStatusController'
import { AccountMenuPane } from '@/Components/AccountMenu/AccountMenuPane'

import { EventObserverInterface } from './EventObserverInterface'

export const JoinWorkspaceSuccessString = 'Successfully joined a shared subscription.'

export class ApplicationEventObserver implements EventObserverInterface {
  constructor(
    private application: WebApplicationInterface,
    private routeService: RouteServiceInterface,
    private purchaseFlowController: PurchaseFlowController,
    private accountMenuController: AccountMenuController,
    private preferencesController: PreferencesController,
    private syncStatusController: SyncStatusController,
    private syncClient: SyncServiceInterface,
    private sessionManager: SessionsClientInterface,
    private subscriptionManager: SubscriptionManagerInterface,
    private toastService: ToastServiceInterface,
    private userService: UserServiceInterface,
  ) {}

  async handle(event: ApplicationEvent): Promise<void> {
    switch (event) {
      case ApplicationEvent.Launched:
        {
          const route = this.routeService.getRoute()
          switch (route.type) {
            case RouteType.Purchase:
              void this.purchaseFlowController.openPurchaseFlow()

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
            case RouteType.UserRequest: {
              const user = this.sessionManager.getUser()
              if (user === undefined) {
                this.promptUserSignIn()

                break
              }
              await this.sendUserRequest(route)

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
            case RouteType.UserRequest:
              await this.sendUserRequest(route)

              break
          }
        }
        break
      case ApplicationEvent.SyncStatusChanged:
        this.syncStatusController.update(this.syncClient.getSyncStatus())
        break
      case ApplicationEvent.LocalDataLoaded:
        if (this.application.isNativeMobileWeb()) {
          this.application.handleInitialMobileScreenshotPrivacy()
        }
        break
    }
  }

  private promptUserSignIn(): void {
    this.accountMenuController.setShow(true)
    this.accountMenuController.setCurrentPane(AccountMenuPane.SignIn)
  }

  private async acceptSubscriptionInvitation(route: RouteParserInterface): Promise<void> {
    const processingToastId = this.toastService.showToast(ToastType.Loading, 'Accepting invitation...')

    const acceptResult = await this.subscriptionManager.acceptInvitation(route.subscriptionInviteParams.inviteUuid)

    this.toastService.hideToast(processingToastId)

    const toastType = acceptResult.success ? ToastType.Success : ToastType.Error
    const toastMessage = acceptResult.success ? JoinWorkspaceSuccessString : acceptResult.message

    this.toastService.showToast(toastType, toastMessage)

    this.routeService.removeQueryParameterFromURL(RootQueryParam.AcceptSubscriptionInvite)
  }

  private async sendUserRequest(route: RouteParserInterface): Promise<void> {
    const processingToastId = this.toastService.showToast(ToastType.Loading, 'Processing your request...')

    const requestSubmittedSuccessfully = await this.userService.submitUserRequest(route.userRequestParams.requestType)

    this.toastService.hideToast(processingToastId)

    const toastType = requestSubmittedSuccessfully ? ToastType.Success : ToastType.Error
    const toastMessage = requestSubmittedSuccessfully
      ? 'We have received your request. Please check your email for further instructions.'
      : 'We could not process your request. Please try again or contact support if the issue persists.'

    this.toastService.showToast(toastType, toastMessage)

    this.routeService.removeQueryParameterFromURL(RootQueryParam.UserRequest)
  }
}
