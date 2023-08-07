import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('vault key management', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createVaultsContextWithRealCrypto()

    await context.launch()
  })

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
    sinon.restore()
  })

  describe('locking', () => {
    it('should throw if attempting to add item to locked vault', async () => {
      const vault = await context.vaults.createUserInputtedPasswordVault({
        name: 'test vault',
        description: 'test vault description',
        userInputtedPassword: 'test password',
        storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
      })

      await context.vaultLocks.lockNonPersistentVault(vault)

      const item = await context.createSyncedNote('test note', 'test note text')

      await Factory.expectThrowsAsync(
        () => context.vaults.moveItemToVault(vault, item),
        'Attempting to add item to locked vault',
      )
    })

    it('should throw if attempting to remove item from locked vault', async () => {
      const vault = await context.vaults.createUserInputtedPasswordVault({
        name: 'test vault',
        description: 'test vault description',
        userInputtedPassword: 'test password',
        storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
      })

      const item = await context.createSyncedNote('test note', 'test note text')

      await context.vaults.moveItemToVault(vault, item)

      await context.vaultLocks.lockNonPersistentVault(vault)

      await Factory.expectThrowsAsync(
        () => context.vaults.removeItemFromVault(item),
        'Attempting to remove item from locked vault',
      )
    })

    it('should lock non-persistent vault', async () => {
      const vault = await context.vaults.createUserInputtedPasswordVault({
        name: 'test vault',
        description: 'test vault description',
        userInputtedPassword: 'test password',
        storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
      })

      await context.vaultLocks.lockNonPersistentVault(vault)

      expect(context.vaultLocks.isVaultLocked(vault)).to.be.true
    })

    it('should not be able to lock user-inputted vault with synced key', async () => {
      const vault = await context.vaults.createUserInputtedPasswordVault({
        name: 'test vault',
        description: 'test vault description',
        userInputtedPassword: 'test password',
        storagePreference: KeySystemRootKeyStorageMode.Synced,
      })

      await Factory.expectThrowsAsync(
        () => context.vaultLocks.lockNonPersistentVault(vault),
        'Vault uses synced key storage and cannot be locked',
      )
    })

    it('should not be able to lock randomized vault', async () => {
      const vault = await context.vaults.createRandomizedVault({
        name: 'test vault',
        description: 'test vault description',
      })

      await Factory.expectThrowsAsync(
        () => context.vaultLocks.lockNonPersistentVault(vault),
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

      await context.vaultLocks.lockNonPersistentVault(vault)

      await Factory.expectThrowsAsync(
        () => context.vaults.changeVaultKeyOptions({ vault }),
        'Attempting to change vault options on a locked vault',
      )
    })
  })

  describe('key rotation and persistence', () => {
    it('rotating ephemeral vault should not persist keys', async () => {
      const vault = await context.vaults.createUserInputtedPasswordVault({
        name: 'test vault',
        description: 'test vault description',
        userInputtedPassword: 'test password',
        storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
      })

      await context.vaults.rotateVaultRootKey(vault, 'test password')

      const syncedKeys = context.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)
      expect(syncedKeys.length).to.equal(0)

      const storedKey = context.keys.getRootKeyFromStorageForVault(vault.systemIdentifier)
      expect(storedKey).to.be.undefined
    })

    it('rotating local vault should not sync keys', async () => {
      const vault = await context.vaults.createUserInputtedPasswordVault({
        name: 'test vault',
        description: 'test vault description',
        userInputtedPassword: 'test password',
        storagePreference: KeySystemRootKeyStorageMode.Local,
      })

      await context.vaults.rotateVaultRootKey(vault, 'test password')

      const syncedKeys = context.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)
      expect(syncedKeys.length).to.equal(0)

      const storedKey = context.keys.getRootKeyFromStorageForVault(vault.systemIdentifier)
      expect(storedKey).to.not.be.undefined
    })

    it('rotating synced vault should sync new key', async () => {
      const vault = await context.vaults.createUserInputtedPasswordVault({
        name: 'test vault',
        description: 'test vault description',
        userInputtedPassword: 'test password',
        storagePreference: KeySystemRootKeyStorageMode.Synced,
      })

      await context.vaults.rotateVaultRootKey(vault, 'test password')

      const syncedKeys = context.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)
      expect(syncedKeys.length).to.equal(2)

      const storedKey = context.keys.getRootKeyFromStorageForVault(vault.systemIdentifier)
      expect(storedKey).to.be.undefined
    })
  })

  describe('memory management', () => {
    it('locking a vault should clear decrypted items keys from memory', async () => {
      const vault = await context.vaults.createUserInputtedPasswordVault({
        name: 'test vault',
        description: 'test vault description',
        userInputtedPassword: 'test password',
        storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
      })

      const itemsKeys = context.keys.getKeySystemItemsKeys(vault.systemIdentifier)
      expect(itemsKeys.length).to.equal(1)

      await context.vaultLocks.lockNonPersistentVault(vault)

      const itemsKeysAfterLock = context.keys.getKeySystemItemsKeys(vault.systemIdentifier)
      expect(itemsKeysAfterLock.length).to.equal(0)
    })

    it('locking then unlocking a vault should bring items keys back into memory', async () => {
      const vault = await context.vaults.createUserInputtedPasswordVault({
        name: 'test vault',
        description: 'test vault description',
        userInputtedPassword: 'test password',
        storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
      })

      await context.vaultLocks.lockNonPersistentVault(vault)
      await context.vaultLocks.unlockNonPersistentVault(vault, 'test password')

      const itemsKeys = context.keys.getKeySystemItemsKeys(vault.systemIdentifier)
      expect(itemsKeys.length).to.equal(1)

      const rootKeys = context.keys.getAllKeySystemRootKeysForVault(vault.systemIdentifier)
      expect(rootKeys.length).to.equal(1)
    })
  })

  describe('changeVaultKeyOptions', () => {
    describe('change storage type', () => {
      it('should not be able to change randomized vault from synced to local', async () => {
        const vault = await context.vaults.createRandomizedVault({
          name: 'test vault',
          description: 'test vault description',
        })

        const result = await context.vaults.changeVaultKeyOptions({
          vault,
          newStorageMode: KeySystemRootKeyStorageMode.Local,
        })

        expect(result.isFailed()).to.be.true
        expect(result.getError()).to.equal('Cannot change storage mode to non-synced for randomized vault')
      })

      it('should not be able to change randomized vault from synced to ephemeral', async () => {
        const vault = await context.vaults.createRandomizedVault({
          name: 'test vault',
          description: 'test vault description',
        })

        const result = await context.vaults.changeVaultKeyOptions({
          vault,
          newStorageMode: KeySystemRootKeyStorageMode.Ephemeral,
        })

        expect(result.isFailed()).to.be.true
        expect(result.getError()).to.equal('Cannot change storage mode to non-synced for randomized vault')
      })

      it('should change user password vault from synced to local', async () => {
        const vault = await context.vaults.createUserInputtedPasswordVault({
          name: 'test vault',
          description: 'test vault description',
          userInputtedPassword: 'test password',
          storagePreference: KeySystemRootKeyStorageMode.Synced,
        })

        let syncedKeys = context.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)

        const result = await context.vaults.changeVaultKeyOptions({
          vault,
          newStorageMode: KeySystemRootKeyStorageMode.Local,
        })

        expect(result.isFailed()).to.be.false

        syncedKeys = context.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)
        expect(syncedKeys.length).to.equal(0)

        const storedKey = context.keys.getRootKeyFromStorageForVault(vault.systemIdentifier)
        expect(storedKey).to.not.be.undefined
      })

      it('should change user password vault from synced to ephemeral', async () => {
        const vault = await context.vaults.createUserInputtedPasswordVault({
          name: 'test vault',
          description: 'test vault description',
          userInputtedPassword: 'test password',
          storagePreference: KeySystemRootKeyStorageMode.Synced,
        })

        let syncedKeys = context.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)

        const result = await context.vaults.changeVaultKeyOptions({
          vault,
          newStorageMode: KeySystemRootKeyStorageMode.Ephemeral,
        })

        expect(result.isFailed()).to.be.false

        syncedKeys = context.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)
        expect(syncedKeys.length).to.equal(0)

        const storedKey = context.keys.getRootKeyFromStorageForVault(vault.systemIdentifier)
        expect(storedKey).to.be.undefined

        const memKeys = context.keys.getAllKeySystemRootKeysForVault(vault.systemIdentifier)
        expect(memKeys.length).to.equal(1)
      })

      it('should change user password vault from local to synced', async () => {
        const vault = await context.vaults.createUserInputtedPasswordVault({
          name: 'test vault',
          description: 'test vault description',
          userInputtedPassword: 'test password',
          storagePreference: KeySystemRootKeyStorageMode.Local,
        })

        let syncedKeys = context.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)

        const result = await context.vaults.changeVaultKeyOptions({
          vault,
          newStorageMode: KeySystemRootKeyStorageMode.Synced,
        })

        expect(result.isFailed()).to.be.false

        syncedKeys = context.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)
        expect(syncedKeys.length).to.equal(1)

        const storedKey = context.keys.getRootKeyFromStorageForVault(vault.systemIdentifier)
        expect(storedKey).to.be.undefined

        const memKeys = context.keys.getAllKeySystemRootKeysForVault(vault.systemIdentifier)
        expect(memKeys.length).to.equal(1)
      })

      it('should change user password vault from local to ephemeral', async () => {
        const vault = await context.vaults.createUserInputtedPasswordVault({
          name: 'test vault',
          description: 'test vault description',
          userInputtedPassword: 'test password',
          storagePreference: KeySystemRootKeyStorageMode.Local,
        })

        let syncedKeys = context.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)

        const result = await context.vaults.changeVaultKeyOptions({
          vault,
          newStorageMode: KeySystemRootKeyStorageMode.Ephemeral,
        })

        expect(result.isFailed()).to.be.false

        syncedKeys = context.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)
        expect(syncedKeys.length).to.equal(0)

        const storedKey = context.keys.getRootKeyFromStorageForVault(vault.systemIdentifier)
        expect(storedKey).to.be.undefined

        const memKeys = context.keys.getAllKeySystemRootKeysForVault(vault.systemIdentifier)
        expect(memKeys.length).to.equal(1)
      })
    })

    describe('change password type', () => {
      it('should fail to change password type from randomized to user inputted if password is not supplied', async () => {
        const vault = await context.vaults.createRandomizedVault({
          name: 'test vault',
          description: 'test vault description',
        })

        const result = await context.vaults.changeVaultKeyOptions({
          vault,
          newPasswordOptions: {
            passwordType: KeySystemPasswordType.UserInputted,
          },
        })

        expect(result.isFailed()).to.be.true
      })

      it('should change password type from randomized to user inputted', async () => {
        const vault = await context.vaults.createRandomizedVault({
          name: 'test vault',
          description: 'test vault description',
        })

        const rootKeysBeforeChange = context.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)
        expect(rootKeysBeforeChange.length).to.equal(1)

        const result = await context.vaults.changeVaultKeyOptions({
          vault,
          newPasswordOptions: {
            passwordType: KeySystemPasswordType.UserInputted,
            userInputtedPassword: 'test password',
          },
        })

        expect(result.isFailed()).to.be.false

        const rootKeysAfterChange = context.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)
        expect(rootKeysAfterChange.length).to.equal(2)

        expect(rootKeysAfterChange[0].itemsKey).to.not.equal(rootKeysAfterChange[1].itemsKey)
      })

      it('should change password type from user inputted to randomized', async () => {
        const vault = await context.vaults.createUserInputtedPasswordVault({
          name: 'test vault',
          description: 'test vault description',
          userInputtedPassword: 'test password',
          storagePreference: KeySystemRootKeyStorageMode.Local,
        })

        const result = await context.vaults.changeVaultKeyOptions({
          vault,
          newPasswordOptions: {
            passwordType: KeySystemPasswordType.Randomized,
          },
        })

        expect(result.isFailed()).to.be.false

        const rootKeysAfterChange = context.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)
        expect(rootKeysAfterChange.length).to.equal(2)

        const storedKey = context.keys.getRootKeyFromStorageForVault(vault.systemIdentifier)
        expect(storedKey).to.be.undefined

        const updatedVault = context.vaults.getVault({ keySystemIdentifier: vault.systemIdentifier })
        expect(updatedVault.keyStorageMode).to.equal(KeySystemRootKeyStorageMode.Synced)
      })

      it('should fail to change password type from user inputted to randomized if storage mode is not synced', async () => {
        const vault = await context.vaults.createUserInputtedPasswordVault({
          name: 'test vault',
          description: 'test vault description',
          userInputtedPassword: 'test password',
          storagePreference: KeySystemRootKeyStorageMode.Local,
        })

        const result = await context.vaults.changeVaultKeyOptions({
          vault,
          newPasswordOptions: {
            passwordType: KeySystemPasswordType.Randomized,
          },
          newStorageMode: KeySystemRootKeyStorageMode.Local,
        })

        expect(result.isFailed()).to.be.true

        expect(result.getError()).to.equal('Cannot change storage mode to non-synced for randomized vault')
      })
    })
  })
})
