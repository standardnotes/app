import { AuthenticatorClientInterface } from '@standardnotes/services'

import { VerifyAuthenticator } from './VerifyAuthenticator'

describe('VerifyAuthenticator', () => {
  let authenticatorClient: AuthenticatorClientInterface
  let authenticatorVerificationPromptFunction: (
    authenticationOptions: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>

  const createUseCase = () => new VerifyAuthenticator(authenticatorClient, authenticatorVerificationPromptFunction)

  beforeEach(() => {
    authenticatorClient = {} as jest.Mocked<AuthenticatorClientInterface>
    authenticatorClient.generateAuthenticationOptions = jest.fn().mockResolvedValue({ foo: 'bar' })
    authenticatorClient.verifyAuthenticationResponse = jest.fn().mockResolvedValue(true)

    authenticatorVerificationPromptFunction = jest.fn()
  })

  it('should return an error if authenticator client fails to generate authentication options', async () => {
    authenticatorClient.generateAuthenticationOptions = jest.fn().mockResolvedValue(null)

    const result = await createUseCase().execute({ userUuid: '00000000-0000-0000-0000-000000000000' })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Could not generate authenticator authentication options')
  })

  it('should return an error if authenticator verification prompt function fails', async () => {
    authenticatorVerificationPromptFunction = jest.fn().mockRejectedValue(new Error('error'))

    const result = await createUseCase().execute({ userUuid: '00000000-0000-0000-0000-000000000000' })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Could not generate authenticator authentication options: error')
  })

  it('should return an error if authenticator client fails to verify authentication response', async () => {
    authenticatorClient.verifyAuthenticationResponse = jest.fn().mockResolvedValue(false)

    const result = await createUseCase().execute({ userUuid: '00000000-0000-0000-0000-000000000000' })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Could not generate authenticator authentication options')
  })

  it('should return ok if authenticator client succeeds to verify authentication response', async () => {
    const result = await createUseCase().execute({ userUuid: '00000000-0000-0000-0000-000000000000' })

    expect(result.isFailed()).toBe(false)
  })

  it('should return an error if user uuid is invalid', async () => {
    const result = await createUseCase().execute({ userUuid: 'invalid' })

    expect(result.isFailed()).toBe(true)
  })

  it('should return error if authenticatorVerificationPromptFunction is not provided', async () => {
    const result = await new VerifyAuthenticator(authenticatorClient).execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe(
      'Could not generate authenticator authentication options: No authenticator verification prompt function provided',
    )
  })
})
