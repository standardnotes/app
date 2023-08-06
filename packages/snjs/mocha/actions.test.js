import * as Factory from './lib/factory.js'
import * as Utils from './lib/Utils.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('actions service', () => {
  const errorProcessingActionMessage = 'An issue occurred while processing this action. Please try again.'

  let application
  let itemManager
  let actionsManager
  let email
  let password
  let authParams
  let fakeServer
  let actionsExtension
  let extensionItemUuid

  beforeEach(async function () {
    this.timeout(20000)

    localStorage.clear()

    application = await Factory.createInitAppWithFakeCrypto()
    itemManager = application.items
    actionsManager = application.actions
    email = UuidGenerator.GenerateUuid()
    password = UuidGenerator.GenerateUuid()

    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    const rootKey = await application.encryption.createRootKey(email, password, KeyParamsOrigination.Registration)
    authParams = rootKey.keyParams.content

    fakeServer = sinon.fakeServer.create()
    fakeServer.respondImmediately = true

    actionsExtension = {
      identifier: 'org.standardnotes.testing',
      name: 'Test extension',
      content_type: 'Extension',
      url: 'http://my-extension.sn.org/get_actions/',
      description: 'For testing purposes.',
      supported_types: ['Note'],
      actions: [
        {
          label: 'Action #1',
          url: 'http://my-extension.sn.org/action_1/',
          verb: 'get',
          context: '*',
          content_types: ['Note'],
        },
        {
          label: 'Action #2',
          url: 'http://my-extension.sn.org/action_2/',
          verb: 'render',
          context: 'Note',
          content_types: ['Note'],
        },
        {
          label: 'Action #3',
          url: 'http://my-extension.sn.org/action_3/',
          verb: 'show',
          context: 'Tag',
          content_types: ['Note'],
        },
        {
          label: 'Action #5',
          url: 'http://my-extension.sn.org/action_5/',
          verb: 'render',
          context: 'Note',
          content_types: ['Note'],
        },
        {
          label: 'Action #7',
          url: 'http://my-extension.sn.org/action_7/',
          verb: 'nested',
          context: 'Note',
          content_types: ['Note'],
        },
      ],
    }

    fakeServer.respondWith('GET', /http:\/\/my-extension.sn.org\/get_actions\/(.*)/, (request, params) => {
      const urlParams = new URLSearchParams(params)
      const extension = Copy(actionsExtension)

      if (urlParams.has('item_uuid')) {
        extension.actions.push({
          label: 'Action #4',
          url: `http://my-extension.sn.org/action_4/?item_uuid=${urlParams.get('item_uuid')}`,
          verb: 'post',
          context: 'Item',
          content_types: ['Note'],
          access_type: 'decrypted',
        })

        extension.actions.push({
          label: 'Action #6',
          url: `http://my-extension.sn.org/action_6/?item_uuid=${urlParams.get('item_uuid')}`,
          verb: 'post',
          context: 'Item',
          content_types: ['Note'],
          access_type: 'encrypted',
        })
      }

      request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(extension))
    })

    const payload = new DecryptedPayload({
      uuid: Utils.generateUuid(),
      content_type: ContentType.TYPES.Note,
      content: {
        title: 'Testing',
      },
    })

    const encryptedPayload = CreateEncryptedServerSyncPushPayload(
      await application.encryption.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [payload],
        },
      }),
    )

    fakeServer.respondWith('GET', /http:\/\/my-extension.sn.org\/action_[1,2]\/(.*)/, (request) => {
      request.respond(
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify({
          item: encryptedPayload,
          auth_params: authParams,
        }),
      )
    })

    fakeServer.respondWith('GET', 'http://my-extension.sn.org/action_3/', [
      200,
      { 'Content-Type': 'text/html; charset=utf-8' },
      '<h2>Action #3</h2>',
    ])

    fakeServer.respondWith('POST', /http:\/\/my-extension.sn.org\/action_[4,6]\/(.*)/, (request) => {
      const requestBody = JSON.parse(request.requestBody)

      const response = {
        uuid: requestBody.items[0].uuid,
        result: 'Action POSTed successfully.',
      }

      request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response))
    })

    fakeServer.respondWith('GET', 'http://my-extension.sn.org/action_5/', (request) => {
      const encryptedPayloadClone = Copy(encryptedPayload)

      encryptedPayloadClone.items_key_id = undefined
      encryptedPayloadClone.content = '003:somenonsense'
      encryptedPayloadClone.enc_item_key = '003:anothernonsense'
      encryptedPayloadClone.version = '003'
      encryptedPayloadClone.uuid = 'fake-uuid'

      const payload = {
        item: encryptedPayloadClone,
        auth_params: authParams,
      }

      request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(payload))
    })

    // Extension item
    const extensionItem = await application.mutator.createItem(ContentType.TYPES.ActionsExtension, actionsExtension)
    extensionItemUuid = extensionItem.uuid
  })

  afterEach(async function () {
    fakeServer.restore()

    await Factory.safeDeinit(application)

    application = undefined
    itemManager = undefined
    actionsManager = undefined
    fakeServer = undefined

    localStorage.clear()
  })

  it('should get extension items', async function () {
    await application.mutator.createItem(ContentType.TYPES.Note, {
      title: 'A simple note',
      text: 'Standard Notes rocks! lml.',
    })
    const extensions = actionsManager.getExtensions()
    expect(extensions.length).to.eq(1)
  })

  it('should get extensions in context of item', async function () {
    const noteItem = await application.mutator.createItem(ContentType.TYPES.Note, {
      title: 'Another note',
      text: 'Whiskey In The Jar',
    })

    const noteItemExtensions = actionsManager.extensionsInContextOfItem(noteItem)
    expect(noteItemExtensions.length).to.eq(1)
    expect(noteItemExtensions[0].supported_types).to.include(noteItem.content_type)
  })

  it('should get actions based on item context', async function () {
    const tagItem = await application.mutator.createItem(ContentType.TYPES.Tag, {
      title: 'Music',
    })

    const extensionItem = await itemManager.findItem(extensionItemUuid)
    const tagActions = extensionItem.actionsWithContextForItem(tagItem)

    expect(tagActions.length).to.eq(1)
    expect(tagActions.map((action) => action.label)).to.have.members(['Action #3'])
  })

  it('should load extension in context of item', async function () {
    const noteItem = await application.mutator.createItem(ContentType.TYPES.Note, {
      title: 'Yet another note',
      text: 'And all things will end ♫',
    })

    const extensionItem = await itemManager.findItem(extensionItemUuid)
    expect(extensionItem.actions.length).to.be.eq(5)

    const extensionWithItem = await actionsManager.loadExtensionInContextOfItem(extensionItem, noteItem)
    expect(extensionWithItem.actions.length).to.be.eq(7)
    expect(extensionWithItem.actions.map((action) => action.label)).to.include.members([
      /**
       * These actions were returned from the server
       * and are relevant for the current item only.
       */
      'Action #4',
      'Action #6',
    ])

    // Actions that are relevant for an item should not be stored.
    const updatedExtensionItem = await itemManager.findItem(extensionItemUuid)
    const expectedActions = extensionItem.actions.map((action) => {
      const { id, ...rest } = action
      return rest
    })
    expect(updatedExtensionItem.actions).to.containSubset(expectedActions)
  })

  describe('render action', async function () {
    const sandbox = sinon.createSandbox()

    let noteItem
    let renderAction
    let alertServiceAlert
    let windowAlert
    let httpServiceGetAbsolute

    beforeEach(async function () {
      noteItem = await application.mutator.createItem(ContentType.TYPES.Note, {
        title: 'Hey',
        text: 'Welcome To Paradise',
      })
      const extensionItem = await itemManager.findItem(extensionItemUuid)

      renderAction = extensionItem.actions.filter((action) => action.verb === 'render')[0]
      alertServiceAlert = sandbox.spy(actionsManager.alertService, 'alert')
      windowAlert = sandbox.stub(window, 'alert').callsFake((message) => message)
    })

    afterEach(async function () {
      sandbox.restore()
    })

    it('should show an alert if the request fails', async function () {
      httpServiceGetAbsolute = sandbox
        .stub(actionsManager.httpService, 'getAbsolute')
        .callsFake((url) => Promise.reject(new Error('Dummy error.')))

      const actionResponse = await actionsManager.runAction(renderAction, noteItem)

      sinon.assert.calledOnceWithExactly(httpServiceGetAbsolute, renderAction.url)
      sinon.assert.calledOnceWithExactly(alertServiceAlert, errorProcessingActionMessage)
      expect(actionResponse.error.message).to.eq(errorProcessingActionMessage)
    })

    it('should return a response if payload is valid', async function () {
      const actionResponse = await actionsManager.runAction(renderAction, noteItem)

      expect(actionResponse).to.have.property('item')
      expect(actionResponse.item.payload.content.title).to.eq('Testing')
    })

    it('should return undefined if payload is invalid', async function () {
      sandbox.stub(actionsManager, 'payloadByDecryptingResponse').returns(null)

      const actionResponse = await actionsManager.runAction(renderAction, noteItem)
      expect(actionResponse).to.be.undefined
    })

    it('should return decrypted payload if password is valid', async function () {
      const extensionItem = await itemManager.findItem(extensionItemUuid)
      renderAction = extensionItem.actions.filter((action) => action.verb === 'render')[0]
      const actionResponse = await actionsManager.runAction(renderAction, noteItem)

      expect(actionResponse.item).to.be.ok
      expect(actionResponse.item.title).to.be.equal('Testing')
    }).timeout(20000)
  })

  describe('show action', async function () {
    const sandbox = sinon.createSandbox()

    let showAction
    let deviceInterfaceOpenUrl

    beforeEach(async function () {
      const extensionItem = await itemManager.findItem(extensionItemUuid)
      showAction = extensionItem.actions[2]
      actionsManager.device.openUrl = (url) => url
      deviceInterfaceOpenUrl = sandbox.spy(actionsManager.device, 'openUrl')
    })

    afterEach(async function () {
      sandbox.restore()
    })

    it('should open the action url', async function () {
      const response = await actionsManager.runAction(showAction)

      sandbox.assert.calledOnceWithExactly(deviceInterfaceOpenUrl, showAction.url)
      expect(response).to.eql({})
    })
  })

  describe('post action', async function () {
    const sandbox = sinon.createSandbox()

    let noteItem
    let extensionItem
    let decryptedPostAction
    let encryptedPostAction
    let alertServiceAlert
    let httpServicePostAbsolute

    beforeEach(async function () {
      noteItem = await application.mutator.createItem(ContentType.TYPES.Note, {
        title: 'Excuse Me',
        text: 'Time To Be King 8)',
      })
      extensionItem = await itemManager.findItem(extensionItemUuid)
      extensionItem = await actionsManager.loadExtensionInContextOfItem(extensionItem, noteItem)

      decryptedPostAction = extensionItem.actions.filter(
        (action) => action.access_type === 'decrypted' && action.verb === 'post',
      )[0]

      encryptedPostAction = extensionItem.actions.filter(
        (action) => action.access_type === 'encrypted' && action.verb === 'post',
      )[0]
      alertServiceAlert = sandbox.spy(actionsManager.alertService, 'alert')
      sandbox.stub(window, 'alert').callsFake((message) => message)
      httpServicePostAbsolute = sandbox.stub(actionsManager.httpService, 'postAbsolute')
      httpServicePostAbsolute.callsFake((url, params) => Promise.resolve(params))
    })

    afterEach(async function () {
      sandbox.restore()
    })

    it('should include generic encrypted payload within request body', async function () {
      const response = await actionsManager.runAction(encryptedPostAction, noteItem)

      expect(response.items[0].enc_item_key).to.satisfy((string) => {
        return string.startsWith(application.encryption.getLatestVersion())
      })
      expect(response.items[0].uuid).to.eq(noteItem.uuid)
      expect(response.items[0].auth_hash).to.not.be.ok
      expect(response.items[0].content_type).to.be.ok
      expect(response.items[0].created_at).to.be.ok
      expect(response.items[0].content).to.satisfy((string) => {
        return string.startsWith(application.encryption.getLatestVersion())
      })
    })

    it('should include generic decrypted payload within request body', async function () {
      const response = await actionsManager.runAction(decryptedPostAction, noteItem)

      expect(response.items[0].uuid).to.eq(noteItem.uuid)
      expect(response.items[0].enc_item_key).to.not.be.ok
      expect(response.items[0].auth_hash).to.not.be.ok
      expect(response.items[0].content_type).to.be.ok
      expect(response.items[0].created_at).to.be.ok
      expect(response.items[0].content.title).to.eq(noteItem.title)
      expect(response.items[0].content.text).to.eq(noteItem.text)
    })

    it('should post to the action url', async function () {
      httpServicePostAbsolute.restore()
      const response = await actionsManager.runAction(decryptedPostAction, noteItem)

      expect(response).to.be.ok
      expect(response.uuid).to.eq(noteItem.uuid)
      expect(response.result).to.eq('Action POSTed successfully.')
    })

    it('should alert if an error occurred while processing the action', async function () {
      httpServicePostAbsolute.restore()
      const dummyError = new Error('Dummy error.')

      sandbox.stub(actionsManager.httpService, 'postAbsolute').callsFake((url, params) => Promise.reject(dummyError))

      const response = await actionsManager.runAction(decryptedPostAction, noteItem)

      sinon.assert.calledOnceWithExactly(alertServiceAlert, errorProcessingActionMessage)
      expect(response).to.be.eq(dummyError)
    })
  })

  describe('nested action', async function () {
    const sandbox = sinon.createSandbox()

    let nestedAction
    let actionsManagerRunAction
    let httpServiceRunHttp
    let actionResponse

    beforeEach(async function () {
      const extensionItem = await itemManager.findItem(extensionItemUuid)
      nestedAction = extensionItem.actions.filter((action) => action.verb === 'nested')[0]
      actionsManagerRunAction = sandbox.spy(actionsManager, 'runAction')
      httpServiceRunHttp = sandbox.spy(actionsManager.httpService, 'runHttp')
      actionResponse = await actionsManager.runAction(nestedAction)
    })

    afterEach(async function () {
      sandbox.restore()
    })

    it('should return undefined', async function () {
      expect(actionResponse).to.be.undefined
    })

    it('should call runAction once', async function () {
      sandbox.assert.calledOnce(actionsManagerRunAction)
    })

    it('should not make any http requests', async function () {
      sandbox.assert.notCalled(httpServiceRunHttp)
    })
  })
})
