import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('migrations', () => {
  const allMigrationsLength = MigrationClasses.length

  beforeEach(async () => {
    localStorage.clear()
  })

  afterEach(async () => {
    localStorage.clear()
  })

  it('version number is stored as string', async function () {
    const application = await Factory.createInitAppWithFakeCrypto()
    const version = await application.migrations.getStoredSnjsVersion()
    expect(typeof version).to.equal('string')
    await Factory.safeDeinit(application)
  })

  it('should return correct required migrations if stored version is 1.0.0', async function () {
    expect((await MigrationService.getRequiredMigrations('1.0.0')).length).to.equal(allMigrationsLength)
  })

  it('should return correct required migrations if stored version is 2.0.0', async function () {
    expect((await MigrationService.getRequiredMigrations('2.0.0')).length).to.equal(allMigrationsLength)
  })

  it('should return 0 required migrations if stored version is futuristic', async function () {
    expect((await MigrationService.getRequiredMigrations('100.0.1')).length).to.equal(0)
  })

  it('after running base migration with no present storage values, should set version to current', async function () {
    const application = await Factory.createAppWithRandNamespace()
    await application.migrations.runBaseMigrationPreRun()
    expect(await application.migrations.getStoredSnjsVersion()).to.equal(SnjsVersion)
    await Factory.safeDeinit(application)
  })

  it('after running all migrations from a 2.0.0 installation, should set stored version to current', async function () {
    const application = await Factory.createAppWithRandNamespace()
    /** Set up 2.0.0 structure with tell-tale storage key */
    await application.device.setRawStorageValue('last_migration_timestamp', JSON.stringify(['anything']))
    await application.prepareForLaunch({
      receiveChallenge: () => {},
    })
    await application.launch(true)
    expect(await application.migrations.getStoredSnjsVersion()).to.equal(SnjsVersion)
    await Factory.safeDeinit(application)
  })

  it('2.20.0 remove mfa migration', async function () {
    const application = await Factory.createAppWithRandNamespace()

    await application.prepareForLaunch({
      receiveChallenge: () => {},
    })
    await application.launch(true)

    const mfaItem = CreateDecryptedItemFromPayload(
      new DecryptedPayload({
        uuid: '123',
        content_type: 'SF|MFA',
        content: FillItemContent({
          key: '123',
        }),
      }),
    )
    await application.mutator.insertItem(mfaItem, true)
    await application.sync.sync()

    expect(application.items.getItems('SF|MFA').length).to.equal(1)
    expect((await application.storage.getAllRawPayloads()).filter((p) => p.content_type === 'SF|MFA').length).to.equal(
      1,
    )

    /** Run migration */
    const migration = new Migration2_20_0(application.migrations.services)
    await migration.handleStage(ApplicationStage.LoadedDatabase_12)

    expect(application.items.getItems('SF|MFA').length).to.equal(0)
    expect((await application.storage.getAllRawPayloads()).filter((p) => p.content_type === 'SF|MFA').length).to.equal(
      0,
    )

    await Factory.safeDeinit(application)
  })

  it('2.42.0 remove no distraction theme', async function () {
    const application = await Factory.createAppWithRandNamespace()

    await application.prepareForLaunch({
      receiveChallenge: () => {},
    })
    await application.launch(true)

    const noDistractionItem = CreateDecryptedItemFromPayload(
      new DecryptedPayload({
        uuid: '123',
        content_type: ContentType.TYPES.Theme,
        content: FillItemContent({
          package_info: {
            identifier: 'org.standardnotes.theme-no-distraction',
          },
        }),
      }),
    )
    await application.mutator.insertItem(noDistractionItem)
    await application.sync.sync()

    expect(application.items.getItems(ContentType.TYPES.Theme).length).to.equal(1)

    /** Run migration */
    const migration = new Migration2_42_0(application.migrations.services)
    await migration.handleStage(ApplicationStage.FullSyncCompleted_13)
    await application.sync.sync()

    expect(application.items.getItems(ContentType.TYPES.Theme).length).to.equal(0)

    await Factory.safeDeinit(application)
  })
})
