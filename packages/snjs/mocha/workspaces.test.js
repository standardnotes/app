import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe.skip('workspaces', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let ownerContext
  let owner
  let inviteeContext
  let invitee

  afterEach(async function () {
    await Factory.safeDeinit(ownerContext.application)
    await Factory.safeDeinit(inviteeContext.application)
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    ownerContext = await Factory.createAppContextWithFakeCrypto()
    await ownerContext.launch()
    const ownerRegistrationResponse = await ownerContext.register()
    owner = ownerRegistrationResponse.user

    inviteeContext = await Factory.createAppContextWithFakeCrypto()
    await inviteeContext.launch()
    const inviteeRegistrationResponse = await inviteeContext.register()
    invitee = inviteeRegistrationResponse.user
  })

  it('should create workspaces for user', async () => {
    await ownerContext.application.workspaceManager.createWorkspace({
      workspaceType: 'team',
      encryptedWorkspaceKey: 'foo',
      encryptedPrivateKey: 'bar',
      publicKey: 'buzz',
      workspaceName: 'Acme Team',
    })

    await ownerContext.application.workspaceManager.createWorkspace({
      workspaceType: 'private',
      encryptedWorkspaceKey: 'foo',
      encryptedPrivateKey: 'bar',
      publicKey: 'buzz',
    })

    const { ownedWorkspaces, joinedWorkspaces } = await ownerContext.application.workspaceManager.listWorkspaces()

    expect(joinedWorkspaces.length).to.equal(0)

    expect(ownedWorkspaces.length).to.equal(2)
  })

  it('should allow inviting and adding users to a workspace', async () => {
    const { uuid } = await ownerContext.application.workspaceManager.createWorkspace({
      workspaceType: 'team',
      encryptedWorkspaceKey: 'foo',
      encryptedPrivateKey: 'bar',
      publicKey: 'buzz',
      workspaceName: 'Acme Team',
    })

    const result = await ownerContext.application.workspaceManager.inviteToWorkspace({
      inviteeEmail: 'test@standardnotes.com',
      workspaceUuid: uuid,
      accessLevel: 'read-only'
    })

    await inviteeContext.application.workspaceManager.acceptInvite({
      inviteUuid: result.uuid,
      userUuid: invitee.uuid,
      publicKey: 'foobar',
      encryptedPrivateKey: 'buzz',
    })

    let listUsersResult = await inviteeContext.application.workspaceManager.listWorkspaceUsers({ workspaceUuid: uuid })
    let inviteeAssociation = listUsersResult.users.find(user => user.userDisplayName === 'test@standardnotes.com')

    expect(inviteeAssociation.userUuid).to.equal(invitee.uuid)
    expect(inviteeAssociation.status).to.equal('pending-keyshare')

    await ownerContext.application.workspaceManager.initiateKeyshare({
      workspaceUuid: inviteeAssociation.workspaceUuid,
      userUuid: inviteeAssociation.userUuid,
      encryptedWorkspaceKey: 'foobarbuzz',
    })

    listUsersResult = await inviteeContext.application.workspaceManager.listWorkspaceUsers({ workspaceUuid: uuid })
    inviteeAssociation = listUsersResult.users.find(user => user.userDisplayName === 'test@standardnotes.com')

    expect(inviteeAssociation.userUuid).to.equal(invitee.uuid)
    expect(inviteeAssociation.status).to.equal('active')
    expect(inviteeAssociation.encryptedWorkspaceKey).to.equal('foobarbuzz')

    const { ownedWorkspaces, joinedWorkspaces } = await inviteeContext.application.workspaceManager.listWorkspaces()

    expect(joinedWorkspaces.length).to.equal(1)

    expect(ownedWorkspaces.length).to.equal(0)
  })
})
