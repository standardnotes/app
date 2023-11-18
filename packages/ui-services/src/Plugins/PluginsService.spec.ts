import { PluginsService } from './PluginsService'
import { AlertService, ItemManagerInterface, LegacyApiServiceInterface } from '@standardnotes/services'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

describe('Plugins Service', () => {
  let itemManager: ItemManagerInterface
  let apiService: LegacyApiServiceInterface
  let pluginsService: PluginsService
  let crypto: PureCryptoInterface

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

    pluginsService = new PluginsService(itemManager, apiService, alertService, crypto)
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

      const result = await pluginsService.installPluginFromUrl(installUrl)
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

      const result = await pluginsService.installPluginFromUrl(installUrl)
      expect(result).toBeUndefined()
    })
  })
})
