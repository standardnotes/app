chai.use(chaiAsPromised)
const expect = chai.expect
import * as Factory from './lib/factory.js'

describe('private workspaces', () => {
  it('generates identifier', async () => {
    const userphrase = 'myworkspaceuserphrase'
    const name = 'myworkspacename'

    const result = await ComputePrivateWorkspaceIdentifier(new SNWebCrypto(), userphrase, name)

    expect(result).to.equal('5155c13a44f333790f6564fbcee0c35a16d26a8359dd77d67d8ecc6ad5d399bb')
  })

  it('application result matches direct function call', async () => {
    const userphrase = 'myworkspaceuserphrase'
    const name = 'myworkspacename'

    const application = (await Factory.createAppContextWithRealCrypto()).application
    const appResult = await application.computePrivateWorkspaceIdentifier(userphrase, name)
    const directResult = await ComputePrivateWorkspaceIdentifier(new SNWebCrypto(), userphrase, name)

    expect(appResult).to.equal(directResult)
  })
})
