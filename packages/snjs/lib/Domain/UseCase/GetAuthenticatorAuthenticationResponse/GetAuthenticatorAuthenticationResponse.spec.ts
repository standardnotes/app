import { GetAuthenticatorAuthenticationResponse } from './GetAuthenticatorAuthenticationResponse'
import { GetAuthenticatorAuthenticationOptions } from '../GetAuthenticatorAuthenticationOptions/GetAuthenticatorAuthenticationOptions'
import { Result } from '@standardnotes/domain-core'

describe('GetAuthenticatorAuthenticationResponse', () => {
  let getAuthenticatorAuthenticationOptions: GetAuthenticatorAuthenticationOptions
  let authenticatorVerificationPromptFunction: (
    authenticationOptions: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>

  const createUseCase = () => new GetAuthenticatorAuthenticationResponse(getAuthenticatorAuthenticationOptions, authenticatorVerificationPromptFunction)

  beforeEach(() => {
    getAuthenticatorAuthenticationOptions = {} as jest.Mocked<GetAuthenticatorAuthenticationOptions>
    getAuthenticatorAuthenticationOptions.execute = jest.fn().mockResolvedValue(Result.ok({ foo: 'bar' }))

    authenticatorVerificationPromptFunction = jest.fn()
  })

  it('should return an error if it fails to generate authentication options', async () => {
    getAuthenticatorAuthenticationOptions.execute = jest.fn().mockReturnValue(Result.fail('error'))

    const result = await createUseCase().execute({
      username: 'test@test.te',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('error')
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
    const result = await new GetAuthenticatorAuthenticationResponse(getAuthenticatorAuthenticationOptions).execute({
      username: 'test@test.te',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe(
      'Could not generate authenticator authentication options: No authenticator verification prompt function provided',
    )
  })
})
