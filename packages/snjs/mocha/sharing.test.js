import * as Factory from './lib/factory.js'
import * as Files from './lib/Files.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('sharing', function () {
  this.timeout(Factory.TwentySecondTimeout)

  const AppHost = 'https://app.standardnotes.com'

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

    sharingService = new SharingService(application.httpService, application.sync, application.options.crypto)
  })

  describe('note sharing', () => {
    it('sharing an item should return a share token and a private key', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const url = await sharingService.shareItem(note.uuid, ShareItemDuration.OneDay, AppHost)
      const { shareToken, privateKey } = sharingService.decodeShareUrl(url)

      expect(shareToken).to.not.be.undefined
      expect(privateKey).to.not.be.undefined
    })

    it('should correctly decrypt shared items', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const url = await sharingService.shareItem(note.uuid, ShareItemDuration.OneDay, AppHost)

      const { item } = await sharingService.getSharedItem(url)

      expect(item.content.title).to.equal('foo')
      expect(item.content.text).to.equal('bar')
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

      const url = await sharingService.shareItem(note.uuid, ShareItemDuration.OneDay, AppHost)

      await context.changeNoteTitleAndSync(note, 'changed note title')

      await updatePromise
      const { item } = await sharingService.getSharedItem(url)

      expect(item.content.title).to.equal('changed note title')
    })

    it('should be able to download shared item without account', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const url = await sharingService.shareItem(note.uuid, ShareItemDuration.OneDay, AppHost)

      const offlineContext = await Factory.createAppContextWithRealCrypto()
      await offlineContext.launch()
      const offlineSharingService = new SharingService(
        offlineContext.application.httpService,
        offlineContext.application.sync,
        offlineContext.application.options.crypto,
      )

      const { item } = await offlineSharingService.getSharedItem(url)

      expect(item.content.title).to.equal('foo')
      expect(item.content.text).to.equal('bar')
    })

    it('should fail to update shared item from other account', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const url = await sharingService.shareItem(note.uuid, ShareItemDuration.OneDay, AppHost)

      const otherContext = await Factory.createAppContextWithRealCrypto()
      await otherContext.launch()
      await otherContext.register()
      const otherSharingService = new SharingService(
        otherContext.application.httpService,
        otherContext.application.sync,
        otherContext.application.options.crypto,
      )

      const { publicKey } = await otherSharingService.getSharedItem(url)
      const { shareToken } = otherSharingService.decodeShareUrl(url)

      otherSharingService.sync.getItem = () => {
        return { contentKey: 'foo' }
      }
      const updateResponse = await otherSharingService.updateSharedItem(note.uuid, shareToken, publicKey)

      expect(isClientDisplayableError(updateResponse)).to.be.true
    })

    it('should expire share immediately after consume', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const url = await sharingService.shareItem(note.uuid, ShareItemDuration.AfterConsume, AppHost)

      await sharingService.getSharedItem(url)
      const secondDownloadResponse = await sharingService.getSharedItem(url)
      expect(isClientDisplayableError(secondDownloadResponse)).to.be.true
    })

    it('should not expire share immediately after consume', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const url = await sharingService.shareItem(note.uuid, ShareItemDuration.OneDay, AppHost)

      await sharingService.getSharedItem(url)
      const secondDownloadResponse = await sharingService.getSharedItem(url)
      expect(secondDownloadResponse.item).to.not.be.undefined
    })

    it('should decode url', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const url = await sharingService.shareItem(note.uuid, ShareItemDuration.OneDay, AppHost)
      const decoded = sharingService.decodeShareUrl(url)

      expect(decoded.shareToken).to.not.be.undefined
      expect(decoded.privateKey).to.not.be.undefined
      expect(decoded.version).to.equal('1.0')
      expect(decoded.thirdPartyApiHost).to.be.undefined
    })
  })

  describe('file sharing', () => {
    beforeEach(async () => {
      await context.publicMockSubscriptionPurchaseEvent()
    })

    it('should be able to download a shared file', async () => {
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const file = await Files.uploadFile(context.application.fileService, buffer, 'my-file', 'md', 1000)

      const url = await sharingService.shareItem(file.uuid, ShareItemDuration.OneDay, AppHost)

      const { item, fileValetToken } = await sharingService.getSharedItem(url)
      expect(fileValetToken).to.not.be.undefined

      const downloadedBytes = await Files.downloadSharedFile(context.application.fileService, item, fileValetToken)
      expect(downloadedBytes).to.eql(buffer)
    })

    it('should be able to download a shared file without account', async () => {
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const file = await Files.uploadFile(context.application.fileService, buffer, 'my-file', 'md', 1000)
      const url = await sharingService.shareItem(file.uuid, ShareItemDuration.OneDay, AppHost)

      const offlineContext = await Factory.createAppContextWithRealCrypto()
      await offlineContext.launch()
      const offlineSharingService = new SharingService(
        offlineContext.application.httpService,
        offlineContext.application.sync,
        offlineContext.application.options.crypto,
      )

      const { item, fileValetToken } = await offlineSharingService.getSharedItem(url)
      const downloadedBytes = await Files.downloadSharedFile(
        offlineContext.application.fileService,
        item,
        fileValetToken,
      )

      expect(downloadedBytes).to.eql(buffer)
    })
  })
})
