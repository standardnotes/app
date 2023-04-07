import { AuthenticatorClientInterface } from '@standardnotes/services'

import { GetAuthenticatorAuthenticationOptions } from './GetAuthenticatorAuthenticationOptions'

describe('GetAuthenticatorAuthenticationOptions', () => {
  let authenticatorClient: AuthenticatorClientInterface

  const createUseCase = () => new GetAuthenticatorAuthenticationOptions(authenticatorClient)

  beforeEach(() => {
    authenticatorClient = {} as jest.Mocked<AuthenticatorClientInterface>
    authenticatorClient.generateAuthenticationOptions = jest.fn().mockResolvedValue({ foo: 'bar' })
  })

  it('should return an error if username is not provided', async () => {
    const result = await createUseCase().execute({
      username: '',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Could not generate authenticator authentication options: Username cannot be empty')
  })

  it('should return an error if authenticator client fails to generate authentication options', async () => {
    authenticatorClient.generateAuthenticationOptions = jest.fn().mockResolvedValue(null)

    const result = await createUseCase().execute({
      username: 'test@test.te',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Could not generate authenticator authentication options')
  })

  it('should return ok if authenticator client succeeds to generate authenticator response', async () => {
    const result = await createUseCase().execute({
      username: 'test@test.te',
    })

    expect(result.isFailed()).toBe(false)
  })
})
