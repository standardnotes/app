import { AuthenticatorClientInterface } from '@standardnotes/services'

import { GetAuthenticatorAuthenticationResponse } from './GetAuthenticatorAuthenticationResponse'

describe('GetAuthenticatorAuthenticationResponse', () => {
  let authenticatorClient: AuthenticatorClientInterface
  let authenticatorVerificationPromptFunction: (
    authenticationOptions: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>

  const createUseCase = () => new GetAuthenticatorAuthenticationResponse(authenticatorClient, authenticatorVerificationPromptFunction)

  beforeEach(() => {
    authenticatorClient = {} as jest.Mocked<AuthenticatorClientInterface>
    authenticatorClient.generateAuthenticationOptions = jest.fn().mockResolvedValue({ foo: 'bar' })

    authenticatorVerificationPromptFunction = jest.fn()
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

  it('should return an error if authenticator verification prompt function fails', async () => {
    authenticatorVerificationPromptFunction = jest.fn().mockRejectedValue(new Error('error'))

    const result = await createUseCase().execute({
      username: 'test@test.te',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Could not generate authenticator authentication options: error')
  })

  it('should return ok if authenticator client succeeds to generate authenticator response', async () => {
    const result = await createUseCase().execute({
      username: 'test@test.te',
    })

    expect(result.isFailed()).toBe(false)
  })

  it('should return error if authenticatorVerificationPromptFunction is not provided', async () => {
    const result = await new GetAuthenticatorAuthenticationResponse(authenticatorClient).execute({
      username: 'test@test.te',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe(
      'Could not generate authenticator authentication options: No authenticator verification prompt function provided',
    )
  })
})
