import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)

const expect = chai.expect

describe('features', () => {
  let application
  let email
  let password

  beforeEach(async function () {
    localStorage.clear()
    application = await Factory.createInitAppWithFakeCrypto()

    sinon.spy(application.mutator, 'createItem')
    sinon.spy(application.mutator, 'changeComponent')
    sinon.spy(application.mutator, 'setItemsToBeDeleted')

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
    localStorage.clear()
    application = undefined
  })

  describe('new user roles received on api response meta', () => {
    it('should save roles and features', async () => {
      expect(application.features.onlineRoles).to.have.lengthOf.above(0)
      expect(application.features.onlineRoles[0]).to.equal('CORE_USER')

      const storedRoles = await application.getValue(StorageKey.UserRoles)

      expect(storedRoles).to.have.lengthOf.above(0)
      expect(storedRoles[0]).to.equal('CORE_USER')
    })
  })

  describe('extension repo items observer', () => {
    it('should migrate to user setting when extension repo is added', async () => {
      sinon.stub(application.features.isApplicationUsingThirdPartyHostUseCase, 'execute').callsFake(() => {
        return Result.ok(false)
      })

      expect(
        await application.settings.getDoesSensitiveSettingExist(
          SettingName.create(SettingName.NAMES.ExtensionKey).getValue(),
        ),
      ).to.equal(false)

      const extensionKey = UuidGenerator.GenerateUuid().split('-').join('')

      const promise = new Promise((resolve) => {
        sinon.stub(application.features, 'migrateFeatureRepoToUserSetting').callsFake(resolve)
      })

      await application.mutator.createItem(
        ContentType.TYPES.ExtensionRepo,
        FillItemContent({
          url: `https://extensions.standardnotes.org/${extensionKey}`,
        }),
      )

      await promise
    })

    it('signing into account with ext repo should migrate it', async () => {
      sinon.stub(application.features.isApplicationUsingThirdPartyHostUseCase, 'execute').callsFake(() => {
        return Result.ok(false)
      })
      /** Attach an ExtensionRepo object to an account, but prevent it from being migrated.
       * Then sign out, sign back in, and ensure the item is migrated. */
      /** Prevent migration from running */
      sinon
        .stub(application.features, 'migrateFeatureRepoToUserSetting')
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .callsFake(() => {})
      const extensionKey = UuidGenerator.GenerateUuid().split('-').join('')
      await application.mutator.createItem(
        ContentType.TYPES.ExtensionRepo,
        FillItemContent({
          url: `https://extensions.standardnotes.org/${extensionKey}`,
        }),
        true,
      )
      await application.sync.sync()
      application = await Factory.signOutApplicationAndReturnNew(application)

      sinon.restore()
      sinon.stub(application.features.isApplicationUsingThirdPartyHostUseCase, 'execute').callsFake(() => {
        return Result.ok(false)
      })
      const promise = new Promise((resolve) => {
        sinon.stub(application.features, 'migrateFeatureRepoToUserSetting').callsFake(resolve)
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
      sinon.stub(application.features.isApplicationUsingThirdPartyHostUseCase, 'execute').callsFake(() => {
        return Result.ok(false)
      })
      const extensionKey = UuidGenerator.GenerateUuid().split('-').join('')
      await application.mutator.createItem(
        ContentType.TYPES.ExtensionRepo,
        FillItemContent({
          url: `https://extensions.standardnotes.org/${extensionKey}`,
        }),
        true,
      )
      await application.sync.sync()

      const promise = new Promise((resolve) => {
        sinon.stub(application.features, 'migrateFeatureRepoToUserSetting').callsFake(resolve)
      })
      await Factory.loginToApplication({
        application,
        email,
        password,
      })
      await promise
    })

    it('migrated ext repo should have property indicating it was migrated', async () => {
      sinon.stub(application.features.isApplicationUsingThirdPartyHostUseCase, 'execute').callsFake(() => {
        return Result.ok(false)
      })
      const setting = SettingName.create(SettingName.NAMES.ExtensionKey).getValue()
      expect(await application.settings.getDoesSensitiveSettingExist(setting)).to.equal(false)
      const extensionKey = UuidGenerator.GenerateUuid().split('-').join('')
      const promise = new Promise((resolve) => {
        application.items.streamItems(ContentType.TYPES.ExtensionRepo, ({ changed }) => {
          for (const item of changed) {
            if (item.content.migratedToUserSetting) {
              resolve()
            }
          }
        })
      })
      await application.mutator.createItem(
        ContentType.TYPES.ExtensionRepo,
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
      await application.mutator.createItem(
        ContentType.TYPES.ExtensionRepo,
        FillItemContent({
          url: `https://extensions.standardnotes.org/${extensionKey}`,
        }),
        true,
      )
      await application.sync.sync()

      const repo = application.features.getOfflineRepo()
      expect(repo.migratedToOfflineEntitlements).to.equal(true)
      expect(repo.offlineFeaturesUrl).to.equal('https://api.standardnotes.com/v1/offline/features')
      expect(repo.offlineKey).to.equal(extensionKey)
    })
  })
})
