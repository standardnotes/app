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

    await this.awaitPromiseOrThrow(sendDataChangePromise)
  }

  async changePassword(password) {
    const promise = this.resolveWhenAsyncFunctionCompletes(this.sharedVaults._handleKeyPairChange, 'execute')

    await super.changePassword(password)

    await this.awaitPromiseOrThrow(promise)
  }

  async syncAndAwaitMessageProcessing() {
    const promise = this.resolveWhenAsyncFunctionCompletes(this.asymmetric, 'handleRemoteReceivedAsymmetricMessages')

    await this.sync()

    await this.awaitPromiseOrThrow(promise)
  }
}
