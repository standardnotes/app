import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('sharing', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let sharingService

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()
    await context.register()

    application = context.application

    sharingService = new SharingService(application.apiService, application.sync, application.options.crypto)
  })

  it('sharing an item should return a share token and a private key', async () => {
    const note = await context.createSyncedNote('foo', 'bar')
    const { shareToken, privateKey } = await sharingService.shareItem(note.uuid)

    expect(shareToken).to.not.be.undefined
    expect(privateKey).to.not.be.undefined
  })

  it('should correctly decrypt shared items', async () => {
    const note = await context.createSyncedNote('foo', 'bar')
    const { shareToken, privateKey } = await sharingService.shareItem(note.uuid)

    const sharedItem = await sharingService.getSharedItem(shareToken, privateKey)

    expect(sharedItem.content.title).to.equal('foo')
    expect(sharedItem.content.text).to.equal('bar')
  })

  it('when shared item is updated, should make request to update shared content key', async () => {
    const note = await context.createSyncedNote('foo', 'bar')

    const updatePromise = new Promise((resolve) => {
      sharingService.addEventObserver((event, data) => {
        if (event === SharingServiceEvent.DidUpdateSharedItem && data.uuid === note.uuid) {
          resolve()
        }
      })
    })

    const { shareToken, privateKey } = await sharingService.shareItem(note.uuid)
    await context.changeNoteTitleAndSync(note, 'changed note title')

    await updatePromise
    const sharedItem = await sharingService.getSharedItem(shareToken, privateKey)

    expect(sharedItem.content.title).to.equal('changed note title')
  })

  it.only('should be able to download shared item without account', async () => {
    const note = await context.createSyncedNote('foo', 'bar')
    const { shareToken, privateKey } = await sharingService.shareItem(note.uuid)

    const offlineContext = await Factory.createAppContextWithRealCrypto()
    await offlineContext.launch()
    const offlineSharingService = new SharingService(
      offlineContext.application.apiService,
      offlineContext.application.sync,
      offlineContext.application.options.crypto,
    )

    const sharedItem = await offlineSharingService.getSharedItem(shareToken, privateKey)

    expect(sharedItem.content.title).to.equal('foo')
    expect(sharedItem.content.text).to.equal('bar')
  })
})
