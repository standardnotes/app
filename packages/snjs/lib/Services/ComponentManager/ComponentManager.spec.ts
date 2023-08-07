import { PreferencesService } from '../Preferences/PreferencesService'
import { GenericItem, Environment, Platform } from '@standardnotes/models'
import {
  InternalEventBusInterface,
  AlertService,
  DeviceInterface,
  MutatorClientInterface,
  ItemManagerInterface,
  SyncServiceInterface,
  PreferenceServiceInterface,
} from '@standardnotes/services'
import { ItemManager } from '@Lib/Services/Items/ItemManager'
import { FeaturesService } from '@Lib/Services/Features/FeaturesService'
import { ComponentManager } from './ComponentManager'
import { SyncService } from '../Sync/SyncService'
import { LoggerInterface } from '@standardnotes/utils'

describe('featuresService', () => {
  let items: ItemManagerInterface
  let mutator: MutatorClientInterface
  let features: FeaturesService
  let alerts: AlertService
  let sync: SyncServiceInterface
  let prefs: PreferenceServiceInterface
  let eventBus: InternalEventBusInterface
  let device: DeviceInterface
  let logger: LoggerInterface

  const createManager = (environment: Environment, platform: Platform) => {
    const manager = new ComponentManager(
      items,
      mutator,
      sync,
      features,
      prefs,
      alerts,
      environment,
      platform,
      device,
      logger,
      eventBus,
    )

    return manager
  }

  beforeEach(() => {
    global.window = {
      addEventListener: jest.fn(),
      attachEvent: jest.fn(),
    } as unknown as Window & typeof globalThis
    logger = {} as jest.Mocked<LoggerInterface>
    logger.info = jest.fn()

    sync = {} as jest.Mocked<SyncService>
    sync.sync = jest.fn()

    items = {} as jest.Mocked<ItemManager>
    items.getItems = jest.fn().mockReturnValue([])
    items.addObserver = jest.fn()

    mutator = {} as jest.Mocked<MutatorClientInterface>
    mutator.createItem = jest.fn()
    mutator.changeComponent = jest.fn().mockReturnValue({} as jest.Mocked<GenericItem>)
    mutator.setItemsToBeDeleted = jest.fn()
    mutator.changeItem = jest.fn()
    mutator.changeFeatureRepo = jest.fn()

    features = {} as jest.Mocked<FeaturesService>

    prefs = {} as jest.Mocked<PreferencesService>
    prefs.addEventObserver = jest.fn()

    alerts = {} as jest.Mocked<AlertService>
    alerts.confirm = jest.fn()
    alerts.alert = jest.fn()

    eventBus = {} as jest.Mocked<InternalEventBusInterface>
    eventBus.publish = jest.fn()

    device = {} as jest.Mocked<DeviceInterface>
  })

  it('should create manager', () => {
    const manager = createManager(Environment.Web, Platform.MacWeb)

    expect(manager).toBeDefined()
  })
})
