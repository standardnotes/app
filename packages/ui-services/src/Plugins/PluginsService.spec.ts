import { ItemInterface } from '@standardnotes/models'
import { PluginsService } from './PluginsService'
import {
  AlertService,
  ItemManagerInterface,
  LegacyApiServiceInterface,
  MutatorClientInterface,
  SyncServiceInterface,
} from '@standardnotes/services'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { ThirdPartyFeatureDescription } from '@standardnotes/features'

describe('Plugins Service', () => {
  let itemManager: ItemManagerInterface
  let apiService: LegacyApiServiceInterface
  let pluginsService: PluginsService
  let crypto: PureCryptoInterface
  let mutator: MutatorClientInterface
  let syncService: SyncServiceInterface

  beforeEach(() => {
    apiService = {} as jest.Mocked<LegacyApiServiceInterface>
    apiService.addEventObserver = jest.fn()
    itemManager = {} as jest.Mocked<ItemManagerInterface>

    crypto = {} as jest.Mocked<PureCryptoInterface>
    crypto.base64Decode = jest.fn()

    itemManager.createTemplateItem = jest.fn().mockReturnValue({})
    itemManager.addObserver = jest.fn()

    let alertService: AlertService
    alertService = {} as jest.Mocked<AlertService>
    alertService.confirm = jest.fn().mockReturnValue(true)
    alertService.alert = jest.fn()

    mutator = {} as jest.Mocked<MutatorClientInterface>
    mutator.createItem = jest.fn()
    mutator.changeComponent = jest.fn().mockReturnValue({} as jest.Mocked<ItemInterface>)
    mutator.setItemsToBeDeleted = jest.fn()
    mutator.changeItem = jest.fn()
    mutator.changeFeatureRepo = jest.fn()

    syncService = {} as jest.Mocked<SyncServiceInterface>
    syncService.sync = jest.fn()

    pluginsService = new PluginsService(itemManager, mutator, syncService, apiService, alertService, crypto)
  })

  describe('downloadRemoteThirdPartyFeature', () => {
    it('should not allow if identifier matches native identifier', async () => {
      apiService.downloadFeatureUrl = jest.fn().mockReturnValue({
        data: {
          identifier: 'org.standardnotes.bold-editor',
          name: 'Bold Editor',
          content_type: 'SN|Component',
          area: 'editor-editor',
          version: '1.0.0',
          url: 'http://localhost:8005/',
        },
      })

      const installUrl = 'http://example.com'
      crypto.base64Decode = jest.fn().mockReturnValue(installUrl)

      const plugin = await pluginsService.getPluginDetailsFromUrl('some-url')
      expect(plugin).toBeDefined()

      const result = await pluginsService.installExternalPlugin(plugin as ThirdPartyFeatureDescription)
      expect(result).toBeUndefined()
    })

    it('should not allow if url matches native url', async () => {
      apiService.downloadFeatureUrl = jest.fn().mockReturnValue({
        data: {
          identifier: 'org.foo.bar',
          name: 'Bold Editor',
          content_type: 'SN|Component',
          area: 'editor-editor',
          version: '1.0.0',
          url: 'http://localhost:8005/org.standardnotes.bold-editor/index.html',
        },
      })

      const installUrl = 'http://example.com'
      crypto.base64Decode = jest.fn().mockReturnValue(installUrl)

      const plugin = await pluginsService.getPluginDetailsFromUrl('some-url')
      expect(plugin).toBeDefined()

      const result = await pluginsService.installExternalPlugin(plugin as ThirdPartyFeatureDescription)
      expect(result).toBeUndefined()
    })
  })
})
