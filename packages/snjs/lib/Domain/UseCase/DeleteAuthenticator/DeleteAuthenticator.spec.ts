import { AuthenticatorClientInterface } from '@standardnotes/services'

import { DeleteAuthenticator } from './DeleteAuthenticator'

describe('DeleteAuthenticator', () => {
  let authenticatorClient: AuthenticatorClientInterface

  const createUseCase = () => new DeleteAuthenticator(authenticatorClient)

  beforeEach(() => {
    authenticatorClient = {} as jest.Mocked<AuthenticatorClientInterface>
    authenticatorClient.delete = jest.fn().mockReturnValue(true)
  })

  it('should delete authenticator', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({ authenticatorId: '00000000-0000-0000-0000-000000000000' })

    expect(result.isFailed()).toBe(false)
  })

  it('should fail if authenticator id is invalid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({ authenticatorId: 'invalid' })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Could not delete authenticator: Given value is not a valid uuid: invalid')
  })

  it('should fail if authenticator client fails to delete authenticator', async () => {
    authenticatorClient.delete = jest.fn().mockReturnValue(false)
    const useCase = createUseCase()

    const result = await useCase.execute({ authenticatorId: '00000000-0000-0000-0000-000000000000' })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Could not delete authenticator')
  })
})
