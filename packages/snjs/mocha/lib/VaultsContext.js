import { AppContext } from './AppContext.js'
import * as Collaboration from './Collaboration.js'

export class VaultsContext extends AppContext {
  constructor(params) {
    super(params)
  }

  async changeVaultName(vault, nameAndDesc) {
    await this.vaults.changeVaultNameAndDescription(vault, {
      name: nameAndDesc.name,
      description: nameAndDesc.description,
    })
  }

  getKeyPair() {
    const result = this.application.dependencies.get(TYPES.GetKeyPairs).execute()

    return result.getValue().encryption
  }

  getSigningKeyPair() {
    const result = this.application.dependencies.get(TYPES.GetKeyPairs).execute()

    return result.getValue().signing
  }

  async changePassword(password) {
    const promise = this.resolveWhenAsyncFunctionCompletes(this.sharedVaults._handleKeyPairChange, 'execute')

    await super.changePassword(password)

    await this.awaitPromiseOrThrow(promise, undefined, 'Waiting for keypair change message to process')
  }

  async syncAndAwaitMessageProcessing() {
    const promise = this.resolveWhenAsyncFunctionCompletes(this.asymmetric, 'handleRemoteReceivedAsymmetricMessages')

    await this.sync()

    await this.awaitPromiseOrThrow(promise, undefined, 'Waiting for messages to process')
  }

  async syncAndAwaitInviteProcessing() {
    const promise = this.resolveWhenAsyncFunctionCompletes(this.vaultInvites, 'processInboundInvites')

    await this.sync()

    await this.awaitPromiseOrThrow(promise, undefined, 'Waiting for invites to process')
  }

  async syncAndAwaitInviteAndMessageProcessing() {
    const invitePromise = this.resolveWhenAsyncFunctionCompletes(this.vaultInvites, 'processInboundInvites')
    const messagePromise = this.resolveWhenAsyncFunctionCompletes(
      this.asymmetric,
      'handleRemoteReceivedAsymmetricMessages',
    )

    await this.sync()

    await Promise.all([
      this.awaitPromiseOrThrow(invitePromise, undefined, 'Waiting for invites to process'),
      this.awaitPromiseOrThrow(messagePromise, undefined, 'Waiting for messages to process'),
    ])
  }

  /**
   * Run a request to keep refresh token from expiring due to long bouts of inactivity for contact context
   * while main context changes password. Tests have a refresh token age of 10s typically, and changing password
   * on CI environment may be time consuming.
   */
  async runAnyRequestToPreventRefreshTokenFromExpiring() {
    await this.asymmetric.getInboundMessages()
  }

  /** Used for long running tests to avoid 498 responses */
  async forceRefreshSession() {
    await this.application.http.refreshSession()
  }

  async createSharedPasswordVault(password) {
    const privateVault = await this.vaults.createUserInputtedPasswordVault({
      name: 'Our Vault',
      userInputtedPassword: password,
      storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
    })

    const note = await this.createSyncedNote('foo', 'bar')

    await this.vaults.moveItemToVault(privateVault, note)

    const sharedVault = await this.sharedVaults.convertVaultToSharedVault(privateVault)
    console.log('createSharedPasswordVault > sharedVault:', sharedVault)

    const { thirdPartyContext, deinitThirdPartyContext } = await Collaboration.inviteNewPartyToSharedVault(
      this,
      sharedVault,
    )

    await Collaboration.acceptAllInvites(thirdPartyContext)

    return { sharedVault, thirdPartyContext, deinitThirdPartyContext }
  }
}
