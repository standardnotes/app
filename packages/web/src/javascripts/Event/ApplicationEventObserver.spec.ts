/**
 * @jest-environment jsdom
 */

import {
  RootQueryParam,
  RouteServiceInterface,
  RouteParserInterface,
  RouteType,
  ToastServiceInterface,
} from '@standardnotes/ui-services'
import { ToastType } from '@standardnotes/toast'
import {
  ApplicationEvent,
  SessionsClientInterface,
  SubscriptionManagerInterface,
  SyncOpStatus,
  SyncServiceInterface,
  User,
  UserServiceInterface,
} from '@standardnotes/snjs'
import { UserRequestType } from '@standardnotes/common'

import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { PreferencesController } from '@/Controllers/PreferencesController'
import { PurchaseFlowController } from '@/Controllers/PurchaseFlow/PurchaseFlowController'
import { SyncStatusController } from '@/Controllers/SyncStatusController'
import { AccountMenuPane } from '@/Components/AccountMenu/AccountMenuPane'

import { ApplicationEventObserver, JoinWorkspaceSuccessString } from './ApplicationEventObserver'
import { WebApplication } from '@/Application/WebApplication'

describe('ApplicationEventObserver', () => {
  let application: WebApplication
  let routeService: RouteServiceInterface
  let purchaseFlowController: PurchaseFlowController
  let accountMenuController: AccountMenuController
  let preferencesController: PreferencesController
  let syncStatusController: SyncStatusController
  let syncClient: SyncServiceInterface
  let sessionManager: SessionsClientInterface
  let subscriptionManager: SubscriptionManagerInterface
  let toastService: ToastServiceInterface
  let userService: UserServiceInterface

  const createObserver = () =>
    new ApplicationEventObserver(
      application,
      routeService,
      purchaseFlowController,
      accountMenuController,
      preferencesController,
      syncStatusController,
      syncClient,
      sessionManager,
      subscriptionManager,
      toastService,
      userService,
    )

  beforeEach(() => {
    application = {} as jest.Mocked<WebApplication>

    routeService = {} as jest.Mocked<RouteServiceInterface>
    routeService.getRoute = jest.fn().mockReturnValue({
      type: RouteType.None,
    } as jest.Mocked<RouteParserInterface>)
    routeService.removeQueryParameterFromURL = jest.fn()

    purchaseFlowController = {} as jest.Mocked<PurchaseFlowController>
    purchaseFlowController.openPurchaseFlow = jest.fn()

    accountMenuController = {} as jest.Mocked<AccountMenuController>
    accountMenuController.setShow = jest.fn()
    accountMenuController.setCurrentPane = jest.fn()

    preferencesController = {} as jest.Mocked<PreferencesController>
    preferencesController.openPreferences = jest.fn()
    preferencesController.setCurrentPane = jest.fn()

    syncStatusController = {} as jest.Mocked<SyncStatusController>
    syncStatusController.update = jest.fn()

    syncClient = {} as jest.Mocked<SyncServiceInterface>
    syncClient.getSyncStatus = jest.fn().mockReturnValue({} as jest.Mocked<SyncOpStatus>)

    sessionManager = {} as jest.Mocked<SessionsClientInterface>
    sessionManager.getUser = jest.fn().mockReturnValue({} as jest.Mocked<User>)

    subscriptionManager = {} as jest.Mocked<SubscriptionManagerInterface>
    subscriptionManager.acceptInvitation = jest.fn()

    toastService = {} as jest.Mocked<ToastServiceInterface>
    toastService.showToast = jest.fn().mockReturnValue('1')
    toastService.hideToast = jest.fn()

    userService = {} as jest.Mocked<UserServiceInterface>
    userService.submitUserRequest = jest.fn().mockReturnValue(true)
  })

  describe('Upon Application Launched', () => {
    it('should open up the purchase flow', async () => {
      routeService.getRoute = jest.fn().mockReturnValue({
        type: RouteType.Purchase,
      } as jest.Mocked<RouteParserInterface>)

      await createObserver().handle(ApplicationEvent.Launched)

      expect(purchaseFlowController.openPurchaseFlow).toHaveBeenCalled()
    })

    it('should open up settings if user is logged in', async () => {
      routeService.getRoute = jest.fn().mockReturnValue({
        type: RouteType.Settings,
        settingsParams: {
          panel: 'general',
        },
      } as jest.Mocked<RouteParserInterface>)

      await createObserver().handle(ApplicationEvent.Launched)

      expect(preferencesController.openPreferences).toHaveBeenCalled()
      expect(preferencesController.setCurrentPane).toHaveBeenCalledWith('general')
    })

    it('should open up sign in if user is not logged in and tries to access settings', async () => {
      sessionManager.getUser = jest.fn().mockReturnValue(undefined)
      routeService.getRoute = jest.fn().mockReturnValue({
        type: RouteType.Settings,
        settingsParams: {
          panel: 'general',
        },
      } as jest.Mocked<RouteParserInterface>)

      await createObserver().handle(ApplicationEvent.Launched)

      expect(accountMenuController.setShow).toHaveBeenCalledWith(true)
      expect(accountMenuController.setCurrentPane).toHaveBeenCalledWith(AccountMenuPane.SignIn)
      expect(preferencesController.openPreferences).not.toHaveBeenCalled()
      expect(preferencesController.setCurrentPane).not.toHaveBeenCalled()
    })

    it('should open up sign in if user is not logged in and to accept subscription invitation', async () => {
      sessionManager.getUser = jest.fn().mockReturnValue(undefined)
      routeService.getRoute = jest.fn().mockReturnValue({
        type: RouteType.AcceptSubscriptionInvite,
        subscriptionInviteParams: {
          inviteUuid: '1-2-3',
        },
      } as jest.Mocked<RouteParserInterface>)

      await createObserver().handle(ApplicationEvent.Launched)

      expect(accountMenuController.setShow).toHaveBeenCalledWith(true)
      expect(accountMenuController.setCurrentPane).toHaveBeenCalledWith(AccountMenuPane.SignIn)
      expect(subscriptionManager.acceptInvitation).not.toHaveBeenCalled()
      expect(toastService.showToast).not.toHaveBeenCalled()
    })

    it('should accept subscription invitation if user is logged in', async () => {
      subscriptionManager.acceptInvitation = jest.fn().mockReturnValue({ success: true })
      routeService.getRoute = jest.fn().mockReturnValue({
        type: RouteType.AcceptSubscriptionInvite,
        subscriptionInviteParams: {
          inviteUuid: '1-2-3',
        },
      } as jest.Mocked<RouteParserInterface>)

      await createObserver().handle(ApplicationEvent.Launched)

      expect(subscriptionManager.acceptInvitation).toHaveBeenCalledWith('1-2-3')
      expect(toastService.showToast).toHaveBeenCalledWith(ToastType.Success, JoinWorkspaceSuccessString)
      expect(routeService.removeQueryParameterFromURL).toHaveBeenCalledWith(RootQueryParam.AcceptSubscriptionInvite)
    })

    it('should show accept subscription invitation failure if user is logged in and accepting fails', async () => {
      subscriptionManager.acceptInvitation = jest.fn().mockReturnValue({ success: false, message: 'Oops!' })

      routeService.getRoute = jest.fn().mockReturnValue({
        type: RouteType.AcceptSubscriptionInvite,
        subscriptionInviteParams: {
          inviteUuid: '1-2-3',
        },
      } as jest.Mocked<RouteParserInterface>)

      await createObserver().handle(ApplicationEvent.Launched)

      expect(subscriptionManager.acceptInvitation).toHaveBeenCalledWith('1-2-3')
      expect(toastService.showToast).toHaveBeenCalledWith(ToastType.Error, 'Oops!')
      expect(routeService.removeQueryParameterFromURL).toHaveBeenCalledWith(RootQueryParam.AcceptSubscriptionInvite)
    })

    it('should open up sign in if user is not logged in and tries to send request', async () => {
      sessionManager.getUser = jest.fn().mockReturnValue(undefined)
      routeService.getRoute = jest.fn().mockReturnValue({
        type: RouteType.UserRequest,
        userRequestParams: {
          requestType: UserRequestType.ExitDiscount,
        },
      } as jest.Mocked<RouteParserInterface>)

      await createObserver().handle(ApplicationEvent.Launched)

      expect(accountMenuController.setShow).toHaveBeenCalledWith(true)
      expect(accountMenuController.setCurrentPane).toHaveBeenCalledWith(AccountMenuPane.SignIn)
      expect(userService.submitUserRequest).not.toHaveBeenCalled()
      expect(toastService.showToast).not.toHaveBeenCalled()
    })

    it('should send user request if user is logged in', async () => {
      userService.submitUserRequest = jest.fn().mockReturnValue(true)
      routeService.getRoute = jest.fn().mockReturnValue({
        type: RouteType.UserRequest,
        userRequestParams: {
          requestType: UserRequestType.ExitDiscount,
        },
      } as jest.Mocked<RouteParserInterface>)

      await createObserver().handle(ApplicationEvent.Launched)

      expect(userService.submitUserRequest).toHaveBeenCalledWith('exit-discount')
      expect(toastService.showToast).toHaveBeenNthCalledWith(
        2,
        ToastType.Success,
        'We have received your request. Please check your email for further instructions.',
      )
      expect(routeService.removeQueryParameterFromURL).toHaveBeenCalledWith(RootQueryParam.UserRequest)
    })

    it('should show sending request failure if user is logged in and sending fails', async () => {
      userService.submitUserRequest = jest.fn().mockReturnValue(false)
      routeService.getRoute = jest.fn().mockReturnValue({
        type: RouteType.UserRequest,
        userRequestParams: {
          requestType: UserRequestType.ExitDiscount,
        },
      } as jest.Mocked<RouteParserInterface>)

      await createObserver().handle(ApplicationEvent.Launched)

      expect(userService.submitUserRequest).toHaveBeenCalledWith('exit-discount')
      expect(toastService.showToast).toHaveBeenNthCalledWith(
        2,
        ToastType.Success,
        'We could not process your request. Please try again or contact support if the issue persists.',
      )
      expect(routeService.removeQueryParameterFromURL).toHaveBeenCalledWith(RootQueryParam.UserRequest)
    })
  })

  describe('Upon Signing In', () => {
    it('should open up settings', async () => {
      routeService.getRoute = jest.fn().mockReturnValue({
        type: RouteType.Settings,
        settingsParams: {
          panel: 'general',
        },
      } as jest.Mocked<RouteParserInterface>)

      await createObserver().handle(ApplicationEvent.SignedIn)

      expect(preferencesController.openPreferences).toHaveBeenCalled()
      expect(preferencesController.setCurrentPane).toHaveBeenCalledWith('general')
    })

    it('should accept subscription invitation', async () => {
      subscriptionManager.acceptInvitation = jest.fn().mockReturnValue({ success: true })
      routeService.getRoute = jest.fn().mockReturnValue({
        type: RouteType.AcceptSubscriptionInvite,
        subscriptionInviteParams: {
          inviteUuid: '1-2-3',
        },
      } as jest.Mocked<RouteParserInterface>)

      await createObserver().handle(ApplicationEvent.SignedIn)

      expect(subscriptionManager.acceptInvitation).toHaveBeenCalledWith('1-2-3')
      expect(toastService.showToast).toHaveBeenCalledWith(ToastType.Success, JoinWorkspaceSuccessString)
      expect(routeService.removeQueryParameterFromURL).toHaveBeenCalledWith(RootQueryParam.AcceptSubscriptionInvite)
    })

    it('should send user request', async () => {
      userService.submitUserRequest = jest.fn().mockReturnValue(true)
      routeService.getRoute = jest.fn().mockReturnValue({
        type: RouteType.UserRequest,
        userRequestParams: {
          requestType: UserRequestType.ExitDiscount,
        },
      } as jest.Mocked<RouteParserInterface>)

      await createObserver().handle(ApplicationEvent.SignedIn)

      expect(userService.submitUserRequest).toHaveBeenCalledWith('exit-discount')
      expect(toastService.showToast).toHaveBeenNthCalledWith(
        2,
        ToastType.Success,
        'We have received your request. Please check your email for further instructions.',
      )
      expect(routeService.removeQueryParameterFromURL).toHaveBeenCalledWith(RootQueryParam.UserRequest)
    })
  })

  describe('Upon Sync Status Changing', () => {
    it('should inform the sync controller', async () => {
      await createObserver().handle(ApplicationEvent.SyncStatusChanged)

      expect(syncStatusController.update).toHaveBeenCalled()
    })
  })

  describe('Upon Database Loaded', () => {
    it('should handle mobile screenshot privacy setting', async () => {
      application.isNativeMobileWeb = jest.fn().mockReturnValue(true)
      application.handleInitialMobileScreenshotPrivacy = jest.fn()

      await createObserver().handle(ApplicationEvent.LocalDataLoaded)

      expect(application.handleInitialMobileScreenshotPrivacy).toHaveBeenCalled()
    })
  })
})
