import { SNLog } from './../Log'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import {
  AlertService,
  DeviceInterface,
  namespacedKey,
  RawStorageKey,
} from '@standardnotes/services'
import { Environment, Platform } from '@standardnotes/models'
import { SNApplication } from './Application'

describe('application', () => {
  // eslint-disable-next-line no-console
  SNLog.onLog = console.log
  SNLog.onError = console.error

  let application: SNApplication
  let device: DeviceInterface
  let crypto: PureCryptoInterface

  beforeEach(async () => {
    const identifier = '123'

    crypto = {} as jest.Mocked<PureCryptoInterface>
    crypto.initialize = jest.fn()

    device = {} as jest.Mocked<DeviceInterface>
    device.openDatabase = jest.fn().mockResolvedValue(true)
    device.getAllRawDatabasePayloads = jest.fn().mockReturnValue([])
    device.setRawStorageValue = jest.fn()
    device.getRawStorageValue = jest.fn().mockImplementation((key) => {
      if (key === namespacedKey(identifier, RawStorageKey.SnjsVersion)) {
        return '10.0.0'
      }
      return undefined
    })
    device.getDatabaseKeys = async () => {
      return Promise.resolve(['1', '2', '3'])
    }

    application = new SNApplication({
      environment: Environment.Mobile,
      platform: Platform.Ios,
      deviceInterface: device,
      crypto: crypto,
      alertService: {} as jest.Mocked<AlertService>,
      identifier: identifier,
      defaultHost: 'localhost',
      appVersion: '1.0',
    })

    await application.prepareForLaunch({ receiveChallenge: jest.fn() })
  })

  it('diagnostics', async () => {
    const diagnostics = await application.getDiagnostics()

    expect(diagnostics).toEqual(
      expect.objectContaining({
        application: expect.objectContaining({
          appVersion: '1.0',
          environment: 3,
          platform: 1,
        }),
        payloads: {
          integrityPayloads: [],
          nonDeletedItemCount: 0,
          invalidPayloadsCount: 0,
        },
        items: { allIds: [] },
        storage: {
          storagePersistable: false,
          persistencePolicy: 'Default',
          encryptionPolicy: 'Default',
          needsPersist: false,
          currentPersistPromise: false,
          isStorageWrapped: false,
          allRawPayloadsCount: 0,
          databaseKeys: ['1', '2', '3'],
        },
        encryption: expect.objectContaining({
          getLatestVersion: '004',
          hasAccount: false,
          getUserVersion: undefined,
          upgradeAvailable: false,
          accountUpgradeAvailable: false,
          passcodeUpgradeAvailable: false,
          hasPasscode: false,
          isPasscodeLocked: false,
          itemsEncryption: expect.objectContaining({
            itemsKeysIds: [],
          }),
          rootKeyEncryption: expect.objectContaining({
            hasRootKey: false,
            keyMode: 'RootKeyNone',
            hasRootKeyWrapper: false,
            hasAccount: false,
            hasPasscode: false,
          }),
        }),
        api: {
          hasSession: false,
          user: undefined,
          registering: false,
          authenticating: false,
          changing: false,
          refreshingSession: false,
          filesHost: undefined,
          host: 'localhost',
        },
        session: {
          isSessionRenewChallengePresented: false,
          online: false,
          offline: true,
          isSignedIn: false,
          isSignedIntoFirstPartyServer: false,
        },
        sync: {
          syncToken: undefined,
          cursorToken: undefined,
          lastSyncDate: undefined,
          outOfSync: false,
          completedOnlineDownloadFirstSync: false,
          clientLocked: false,
          databaseLoaded: false,
          syncLock: false,
          dealloced: false,
          itemsNeedingSync: [],
          itemsNeedingSyncCount: 0,
          pendingRequestCount: 0,
        },
        protections: expect.objectContaining({
          getLastSessionLength: undefined,
          hasProtectionSources: false,
          hasUnprotectedAccessSession: true,
          hasBiometricsEnabled: false,
        }),
        keyRecovery: { queueLength: 0, isProcessingQueue: false },
        features: {
          roles: [],
          features: [],
          enabledExperimentalFeatures: [],
          needsInitialFeaturesUpdate: true,
          completedSuccessfulFeaturesRetrieval: false,
        },
        migrations: { activeMigrations: [] },
      }),
    )
  })
})
