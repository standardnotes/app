import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('vault locking', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()
    await context.register()
  })

  it('should lock non-persistent vault', async () => {
    const vault = await context.vaults.createUserInputtedPasswordVault({
      name: 'test vault',
      description: 'test vault description',
      userInputtedPassword: 'test password',
      storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
    })

    context.vaultLocks.lockNonPersistentVault(vault)

    expect(context.vaultLocks.isVaultLocked(vault)).to.be.true
  })

  it('should not be able to lock user-inputted vault with synced key', async () => {
    const vault = await context.vaults.createUserInputtedPasswordVault({
      name: 'test vault',
      description: 'test vault description',
      userInputtedPassword: 'test password',
      storagePreference: KeySystemRootKeyStorageMode.Synced,
    })

    expect(() => context.vaultLocks.lockNonPersistentVault(vault)).to.throw(
      Error,
      'Vault uses synced key storage and cannot be locked',
    )
  })

  it('should not be able to lock randomized vault', async () => {
    const vault = await context.vaults.createRandomizedVault({
      name: 'test vault',
      description: 'test vault description',
    })

    expect(() => context.vaultLocks.lockNonPersistentVault(vault)).to.throw(
      Error,
      'Vault uses synced key storage and cannot be locked',
    )
  })

  it('should throw if attempting to change password of locked vault', async () => {
    const vault = await context.vaults.createUserInputtedPasswordVault({
      name: 'test vault',
      description: 'test vault description',
      userInputtedPassword: 'test password',
      storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
    })

    context.vaultLocks.lockNonPersistentVault(vault)

    await Factory.expectThrowsAsync(
      () => context.vaults.changeVaultOptions({ vault }),
      'Attempting to change vault options on a locked vault',
    )
  })

  it('should respect storage preference when rotating key system root key', async () => {
    console.error('TODO: implement')
  })

  it('should change storage preference from synced to local', async () => {
    console.error('TODO: implement')
  })

  it('should change storage preference from local to synced', async () => {
    console.error('TODO: implement')
  })

  it('should resync key system items key if it is encrypted with noncurrent key system root key', async () => {
    console.error('TODO: implement')
  })

  it('should change password type from user inputted to randomized', async () => {
    console.error('TODO: implement')
  })

  it('should change password type from randomized to user inputted', async () => {
    console.error('TODO: implement')
  })

  it('should not be able to change storage mode of third party vault', async () => {
    console.error('TODO: implement')
  })
})
