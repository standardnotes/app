import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('sharing', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let sharingService
  let mockApi

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

    const mockServerData = {
      sharedItems: {},
      items: {},
    }

    context.callBackWithUploadedPayloads((payloads) => {
      for (const payload of payloads) {
        mockServerData.items[payload.uuid] = payload
      }
    })

    mockApi = {
      async getSharedItem(shareToken) {
        const data = mockServerData.sharedItems[shareToken]
        const item = mockServerData.items[data.itemUuid]
        return { item, publicKey: data.publicKey, encryptedContentKey: data.encryptedContentKey }
      },

      shareItem(params) {
        const shareToken = UuidGenerator.GenerateUuid()
        mockServerData.sharedItems[shareToken] = params
        return { ...params, shareToken }
      },

      updateSharedItem(params) {
        const existingData = mockServerData.sharedItems[params.shareToken]
        mockServerData.sharedItems[params.shareToken] = {
          ...existingData,
          ...params
        }
        return params
      },

      getInitiatedShares() {
        return Object.values(mockServerData.sharedItems)
      },
    }

    sharingService = new SharingService(mockApi, application.sync, application.options.crypto)
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
})
