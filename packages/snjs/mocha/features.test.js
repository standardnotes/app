/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('features', () => {
  let application
  let email
  let password
  let midnightThemeFeature
  let plusEditorFeature
  let tagNestingFeature
  let getUserFeatures

  beforeEach(async function () {
    application = await Factory.createInitAppWithFakeCrypto()

    const now = new Date()
    const tomorrow = now.setDate(now.getDate() + 1)

    midnightThemeFeature = {
      ...GetFeatures().find((feature) => feature.identifier === FeatureIdentifier.MidnightTheme),
      expires_at: tomorrow,
    }
    plusEditorFeature = {
      ...GetFeatures().find((feature) => feature.identifier === FeatureIdentifier.PlusEditor),
      expires_at: tomorrow,
    }
    tagNestingFeature = {
      ...GetFeatures().find((feature) => feature.identifier === FeatureIdentifier.TagNesting),
      expires_at: tomorrow,
    }

    sinon.spy(application.itemManager, 'createItem')
    sinon.spy(application.itemManager, 'changeComponent')
    sinon.spy(application.itemManager, 'setItemsToBeDeleted')

    getUserFeatures = sinon.stub(application.apiService, 'getUserFeatures').callsFake(() => {
      return Promise.resolve({
        data: {
          features: [midnightThemeFeature, plusEditorFeature, tagNestingFeature],
        },
      })
    })

    email = UuidGenerator.GenerateUuid()
    password = UuidGenerator.GenerateUuid()

    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })
  })

  afterEach(async function () {
    Factory.safeDeinit(application)
    sinon.restore()
  })

  describe('new user roles received on api response meta', () => {
    it('should save roles and features', async () => {
      expect(application.featuresService.roles).to.have.lengthOf(1)
      expect(application.featuresService.roles[0]).to.equal('CORE_USER')

      expect(application.featuresService.features).to.have.lengthOf(3)
      expect(application.featuresService.features[0]).to.containSubset(midnightThemeFeature)
      expect(application.featuresService.features[1]).to.containSubset(plusEditorFeature)

      const storedRoles = await application.getValue(StorageKey.UserRoles)

      expect(storedRoles).to.have.lengthOf(1)
      expect(storedRoles[0]).to.equal('CORE_USER')

      const storedFeatures = await application.getValue(StorageKey.UserFeatures)

      expect(storedFeatures).to.have.lengthOf(3)
      expect(storedFeatures[0]).to.containSubset(midnightThemeFeature)
      expect(storedFeatures[1]).to.containSubset(plusEditorFeature)
      expect(storedFeatures[2]).to.containSubset(tagNestingFeature)
    })

    it('should fetch user features and create items for features with content type', async () => {
      expect(application.apiService.getUserFeatures.callCount).to.equal(1)
      expect(application.itemManager.createItem.callCount).to.equal(2)
      const themeItems = application.items.getItems(ContentType.Theme)
      const editorItems = application.items.getItems(ContentType.Component)
      expect(themeItems).to.have.lengthOf(1)
      expect(editorItems).to.have.lengthOf(1)
      expect(themeItems[0].content).to.containSubset(
        JSON.parse(
          JSON.stringify({
            name: midnightThemeFeature.name,
            package_info: midnightThemeFeature,
            valid_until: new Date(midnightThemeFeature.expires_at),
          }),
        ),
      )
      expect(editorItems[0].content).to.containSubset(
        JSON.parse(
          JSON.stringify({
            name: plusEditorFeature.name,
            area: plusEditorFeature.area,
            package_info: plusEditorFeature,
            valid_until: new Date(midnightThemeFeature.expires_at),
          }),
        ),
      )
    })

    it('should update content for existing feature items', async () => {
      // Wipe items from initial sync
      await application.itemManager.removeAllItemsFromMemory()
      // Wipe roles from initial sync
      await application.featuresService.setRoles([])
      // Create pre-existing item for theme without all the info
      await application.itemManager.createItem(
        ContentType.Theme,
        FillItemContent({
          package_info: {
            identifier: FeatureIdentifier.MidnightTheme,
          },
        }),
      )
      // Call sync intentionally to get roles again in meta
      await application.sync.sync()
      // Timeout since we don't await for features update
      await new Promise((resolve) => setTimeout(resolve, 1000))
      expect(application.itemManager.changeComponent.callCount).to.equal(1)
      const themeItems = application.items.getItems(ContentType.Theme)
      expect(themeItems).to.have.lengthOf(1)
      expect(themeItems[0].content).to.containSubset(
        JSON.parse(
          JSON.stringify({
            package_info: midnightThemeFeature,
            valid_until: new Date(midnightThemeFeature.expires_at),
          }),
        ),
      )
    })

    it('should delete theme item if feature has expired', async () => {
      const now = new Date()
      const yesterday = now.setDate(now.getDate() - 1)

      getUserFeatures.restore()
      sinon.stub(application.apiService, 'getUserFeatures').callsFake(() => {
        return Promise.resolve({
          data: {
            features: [
              {
                ...midnightThemeFeature,
                expires_at: yesterday,
              },
            ],
          },
        })
      })

      const themeItem = application.items.getItems(ContentType.Theme)[0]

      // Wipe roles from initial sync
      await application.featuresService.setRoles([])

      // Call sync intentionally to get roles again in meta
      await application.sync.sync()

      // Timeout since we don't await for features update
      await new Promise((resolve) => setTimeout(resolve, 1000))
      expect(application.itemManager.setItemsToBeDeleted.calledWith([sinon.match({ uuid: themeItem.uuid })])).to.equal(
        true,
      )

      const noTheme = application.items.getItems(ContentType.Theme)[0]
      expect(noTheme).to.not.be.ok
    })
  })

  it('should provide feature', async () => {
    const feature = application.features.getUserFeature(FeatureIdentifier.PlusEditor)
    expect(feature).to.containSubset(plusEditorFeature)
  })

  describe('extension repo items observer', () => {
    it('should migrate to user setting when extension repo is added', async () => {
      sinon.stub(application.apiService, 'isThirdPartyHostUsed').callsFake(() => {
        return false
      })

      expect(await application.settings.getDoesSensitiveSettingExist(SettingName.ExtensionKey)).to.equal(false)

      const extensionKey = UuidGenerator.GenerateUuid().split('-').join('')

      const promise = new Promise((resolve) => {
        sinon.stub(application.featuresService, 'migrateFeatureRepoToUserSetting').callsFake(resolve)
      })

      await application.itemManager.createItem(
        ContentType.ExtensionRepo,
        FillItemContent({
          url: `https://extensions.standardnotes.org/${extensionKey}`,
        }),
      )

      await promise
    })

    it('signing into account with ext repo should migrate it', async () => {
      sinon.stub(application.apiService, 'isThirdPartyHostUsed').callsFake(() => {
        return false
      })
      /** Attach an ExtensionRepo object to an account, but prevent it from being migrated.
       * Then sign out, sign back in, and ensure the item is migrated. */
      /** Prevent migration from running */
      sinon
        .stub(application.featuresService, 'migrateFeatureRepoToUserSetting')
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .callsFake(() => {})
      const extensionKey = UuidGenerator.GenerateUuid().split('-').join('')
      await application.itemManager.createItem(
        ContentType.ExtensionRepo,
        FillItemContent({
          url: `https://extensions.standardnotes.org/${extensionKey}`,
        }),
        true,
      )
      await application.sync.sync()
      application = await Factory.signOutApplicationAndReturnNew(application)

      sinon.restore()
      sinon.stub(application.apiService, 'isThirdPartyHostUsed').callsFake(() => {
        return false
      })
      const promise = new Promise((resolve) => {
        sinon.stub(application.featuresService, 'migrateFeatureRepoToUserSetting').callsFake(resolve)
      })
      await Factory.loginToApplication({
        application,
        email,
        password,
      })
      await promise
    })

    it('having an ext repo with no account, then signing into account, should migrate it', async () => {
      application = await Factory.signOutApplicationAndReturnNew(application)
      sinon.stub(application.apiService, 'isThirdPartyHostUsed').callsFake(() => {
        return false
      })
      const extensionKey = UuidGenerator.GenerateUuid().split('-').join('')
      await application.itemManager.createItem(
        ContentType.ExtensionRepo,
        FillItemContent({
          url: `https://extensions.standardnotes.org/${extensionKey}`,
        }),
        true,
      )
      await application.sync.sync()

      const promise = new Promise((resolve) => {
        sinon.stub(application.featuresService, 'migrateFeatureRepoToUserSetting').callsFake(resolve)
      })
      await Factory.loginToApplication({
        application,
        email,
        password,
      })
      await promise
    })

    it.skip('migrated ext repo should have property indicating it was migrated', async () => {
      sinon.stub(application.apiService, 'isThirdPartyHostUsed').callsFake(() => {
        return false
      })
      expect(await application.settings.getDoesSensitiveSettingExist(SettingName.ExtensionKey)).to.equal(false)
      const extensionKey = UuidGenerator.GenerateUuid().split('-').join('')
      const promise = new Promise((resolve) => {
        application.streamItems(ContentType.ExtensionRepo, ({ changed }) => {
          for (const item of changed) {
            if (item.content.migratedToUserSetting) {
              resolve()
            }
          }
        })
      })
      await application.itemManager.createItem(
        ContentType.ExtensionRepo,
        FillItemContent({
          url: `https://extensions.standardnotes.org/${extensionKey}`,
        }),
      )
      await promise
    })
  })

  describe('offline features migration', () => {
    it('previous extension repo should be migrated to offline feature repo', async () => {
      application = await Factory.signOutApplicationAndReturnNew(application)
      const extensionKey = UuidGenerator.GenerateUuid().split('-').join('')
      await application.itemManager.createItem(
        ContentType.ExtensionRepo,
        FillItemContent({
          url: `https://extensions.standardnotes.org/${extensionKey}`,
        }),
        true,
      )
      await application.sync.sync()

      const repo = application.featuresService.getOfflineRepo()
      expect(repo.migratedToOfflineEntitlements).to.equal(true)
      expect(repo.offlineFeaturesUrl).to.equal('https://api.standardnotes.com/v1/offline/features')
      expect(repo.offlineKey).to.equal(extensionKey)
    })
  })
})
