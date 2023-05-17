import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('groups', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let groupService

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

    groupService = new GroupService(
      application.httpService,
      application.sync,
      application.items,
      application.protocolService,
      application.sessions,
      application.internalEventBus,
    )
  })

  it('should create keypair during registration', () => {
    expect(groupService.userPublicKey).to.not.be.undefined
    expect(groupService.userDecryptedPrivateKey).to.not.be.undefined
  })

  it.only('should create a group', async () => {
    const group = await groupService.createGroup()
    expect(group).to.not.be.undefined

    const sharedItemsKeys = application.items.sharedItemsKeysForGroup(group.uuid)
    expect(sharedItemsKeys.length).to.equal(1)

    const sharedItemsKey = sharedItemsKeys[0]
    expect(sharedItemsKey instanceof SharedItemsKey).to.be.true
  })
})
