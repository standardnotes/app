/**
 * @jest-environment jsdom
 */

import { RouteServiceInterface, RouteType } from '@standardnotes/ui-services'
import { ApplicationEvent, SessionsClientInterface, SyncClientInterface, SyncOpStatus, User } from '@standardnotes/snjs'

import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { PreferencesController } from '@/Controllers/PreferencesController'
import { PurchaseFlowController } from '@/Controllers/PurchaseFlow/PurchaseFlowController'
import { SyncStatusController } from '@/Controllers/SyncStatusController'

import { ApplicationEventObserver } from './ApplicationEventObserver'
import { RouteParserInterface } from '@standardnotes/ui-services/dist/Route/RouteParserInterface'
import { AccountMenuPane } from '@/Components/AccountMenu/AccountMenuPane'

describe('ApplicationEventObserver', () => {
  let routeService: RouteServiceInterface
  let purchaseFlowController: PurchaseFlowController
  let accountMenuController: AccountMenuController
  let preferencesController: PreferencesController
  let syncStatusController: SyncStatusController
  let syncClient: SyncClientInterface
  let sessionManager: SessionsClientInterface

  const createObserver = () =>
    new ApplicationEventObserver(
      routeService,
      purchaseFlowController,
      accountMenuController,
      preferencesController,
      syncStatusController,
      syncClient,
      sessionManager,
    )

  beforeEach(() => {
    routeService = {} as jest.Mocked<RouteServiceInterface>
    routeService.getRoute = jest.fn().mockReturnValue({
      type: RouteType.None,
    } as jest.Mocked<RouteParserInterface>)

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

    syncClient = {} as jest.Mocked<SyncClientInterface>
    syncClient.getSyncStatus = jest.fn().mockReturnValue({} as jest.Mocked<SyncOpStatus>)

    sessionManager = {} as jest.Mocked<SessionsClientInterface>
    sessionManager.getUser = jest.fn().mockReturnValue({} as jest.Mocked<User>)
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
  })

  describe('Upon Sync Status Changing', () => {
    it('should inform the sync controller', async () => {
      await createObserver().handle(ApplicationEvent.SyncStatusChanged)

      expect(syncStatusController.update).toHaveBeenCalled()
    })
  })
})
