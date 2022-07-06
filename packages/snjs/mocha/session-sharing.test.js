/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('session sharing', function () {
  this.timeout(Factory.TenSecondTimeout)

  beforeEach(async function () {
    localStorage.clear()

    this.context = await Factory.createAppContext()
    await this.context.launch()

    this.application = this.context.application
    this.email = this.context.email
    this.password = this.context.password

    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })
  })

  afterEach(async function () {
    await this.context.deinit()
    this.context = undefined
    this.application = undefined
    localStorage.clear()
  })

  it('share token payloads should include neccessary params', async function () {
    const token = await this.application.sessions.createDemoShareToken()
    const payload = await this.application.sessions.decodeDemoShareToken(token)

    const expectedKeys = [
      'accessToken',
      'refreshToken',
      'accessExpiration',
      'refreshExpiration',
      'readonlyAccess',
      'masterKey',
      'keyParams',
      'user',
      'host',
    ]

    for (const key of expectedKeys) {
      expect(payload[key]).to.not.be.undefined
    }
  })

  it('populating session from share token should allow pulling in new items', async function () {
    const token = await this.application.sessions.createDemoShareToken()

    await Factory.createSyncedNote(this.application, 'demo title', 'demo text')

    const otherContext = await Factory.createAppContext()
    await otherContext.launch()

    const otherApplication = otherContext.application

    expect(otherApplication.items.getItems(ContentType.Note).length).to.equal(0)

    await otherApplication.sessions.populateSessionFromDemoShareToken(token)

    await otherApplication.sync.sync()

    const notes = otherApplication.items.getItems(ContentType.Note)

    expect(notes.length).to.equal(1)

    const note = notes[0]

    expect(note.title).to.equal('demo title')
    expect(note.text).to.equal('demo text')

    await otherContext.deinit()
  })

  /**
   * Demo session tokens can only be created manually via raw SQL entry on the DB side.
   * There is no API to create share tokens. Therefore, the share token below is made from
   * a copy of the master session, which is not readonly.
   */
  it.skip('populating session from share token should not allow making changes', async function () {
    const token = await this.application.sessions.createDemoShareToken()

    await Factory.createSyncedNote(this.application, 'demo title', 'demo text')

    const otherContext = await Factory.createAppContext()
    await otherContext.launch()

    const otherApplication = otherContext.application

    await otherApplication.sessions.populateSessionFromDemoShareToken(token)

    await otherApplication.sync.sync()

    const note = otherApplication.items.getItems(ContentType.Note)[0]

    const syncResponse = otherContext.awaitNextSyncEvent(SyncEvent.SingleRoundTripSyncCompleted)

    await otherApplication.mutator.changeAndSaveItem(note, (mutator) => {
      mutator.title = 'unauthorized change'
    })

    const result = await syncResponse

    expect(result.rawResponse.unsaved_items.length).to.equal(1)
  })
})
