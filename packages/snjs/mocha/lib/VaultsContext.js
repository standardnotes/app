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
}
