import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('vault key sharing', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createVaultsContextWithRealCrypto()

    await context.launch()
    await context.register()
  })

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
    sinon.restore()
    context = undefined
  })

  it('sharing a vault with user inputted and ephemeral password should share the key as synced for the recipient', async () => {
    const privateVault = await context.vaults.createUserInputtedPasswordVault({
      name: 'My Private Vault',
      userInputtedPassword: 'password',
      storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
    })

    const note = await context.createSyncedNote('foo', 'bar')
    await context.vaults.moveItemToVault(privateVault, note)

    const sharedVault = await context.sharedVaults.convertVaultToSharedVault(privateVault)

    const { thirdPartyContext, deinitThirdPartyContext } = await Collaboration.inviteNewPartyToSharedVault(
      context,
      sharedVault,
    )

    await Collaboration.acceptAllInvites(thirdPartyContext)

    const rootKey = thirdPartyContext.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)
    expect(rootKey).to.not.be.undefined

    const contextNote = thirdPartyContext.items.findItem(note.uuid)
    expect(contextNote).to.not.be.undefined
    expect(contextNote.title).to.equal('foo')
    expect(contextNote.text).to.equal(note.text)

    await deinitThirdPartyContext()
  })

  it('should send key change message when vault password is changed', async () => {
    const { sharedVault, thirdPartyContext, deinitThirdPartyContext } = await context.createSharedPasswordVault(
      'test password',
    )

    const rootKeyBeforeChange = thirdPartyContext.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)

    await context.vaults.changeVaultKeyOptions({
      vault: sharedVault,
      newPasswordOptions: {
        passwordType: KeySystemPasswordType.UserInputted,
        userInputtedPassword: 'new password',
      },
    })

    await thirdPartyContext.syncAndAwaitMessageProcessing()

    const rootKeyAfterChange = thirdPartyContext.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)

    expect(rootKeyBeforeChange.itemsKey).to.not.equal(rootKeyAfterChange.itemsKey)

    await deinitThirdPartyContext()
  })
})
