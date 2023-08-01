import { AppContext } from './AppContext.js'

export class VaultsContext extends AppContext {
  constructor(params) {
    super(params)
  }

  async changeVaultName(vault, nameAndDesc) {
    const sendDataChangePromise = this.resolveWhenAsyncFunctionCompletes(
      this.sharedVaults._sendVaultDataChangeMessage,
      'execute',
    )

    await this.vaults.changeVaultNameAndDescription(vault, {
      name: nameAndDesc.name,
      description: nameAndDesc.description,
    })

    await this.awaitPromiseOrThrow(sendDataChangePromise, undefined, 'Waiting for vault data change message to process')
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
}
