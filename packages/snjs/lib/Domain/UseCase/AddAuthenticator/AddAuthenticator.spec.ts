import { AuthenticatorClientInterface } from '@standardnotes/services'
import { AddAuthenticator } from './AddAuthenticator'

describe('AddAuthenticator', () => {
  let authenticatorClient: AuthenticatorClientInterface
  let authenticatorRegistrationPromptFunction: (
    registrationOptions: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>


  const createUseCase = () => new AddAuthenticator(authenticatorClient, authenticatorRegistrationPromptFunction)

  beforeEach(() => {
    authenticatorClient = {} as jest.Mocked<AuthenticatorClientInterface>
    authenticatorClient.generateRegistrationOptions = jest.fn().mockReturnValue({ foo: 'bar' })
    authenticatorClient.verifyRegistrationResponse = jest.fn().mockReturnValue(true)

    authenticatorRegistrationPromptFunction = jest.fn()
  })

  it('should return error if userUuid is invalid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: 'invalid',
      authenticatorName: 'authenticatorName',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Could not generate authenticator registration options: Given value is not a valid uuid: invalid')
  })

  it('should return error if authenticatorName is invalid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      authenticatorName: '',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Could not generate authenticator registration options: Given value is empty: ')
  })

  it('should return error if registration options are null', async () => {
    authenticatorClient.generateRegistrationOptions = jest.fn().mockReturnValue(null)

    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      authenticatorName: 'authenticator',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Could not generate authenticator registration options')
  })

  it('should return error if authenticatorRegistrationPromptFunction throws', async () => {
    authenticatorRegistrationPromptFunction = jest.fn().mockRejectedValue(new Error('error'))

    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      authenticatorName: 'authenticator',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Could not generate authenticator registration options: error')
  })

  it('should return error if authenticatorRegistrationPromptFunction throws InvalidStateError', async () => {
    const error = new Error('error')
    error.name = 'InvalidStateError'
    authenticatorRegistrationPromptFunction = jest.fn().mockRejectedValue(error)

    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      authenticatorName: 'authenticator',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Authenticator was probably already registered by user')
  })

  it('should return error if registration response verification returns false', async () => {
    authenticatorClient.verifyRegistrationResponse = jest.fn().mockReturnValue(false)

    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',

      authenticatorName: 'authenticator',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Could not verify authenticator registration response')
  })

  it('should register an authenticator', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      authenticatorName: 'authenticator',
    })

    expect(result.isFailed()).toBe(false)
  })

  it('should return error if authenticator registration prompt function is not passed', async () => {
    const useCase = new AddAuthenticator(authenticatorClient)

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      authenticatorName: 'authenticator',
    })

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('Could not generate authenticator registration options: No authenticator registration prompt function provided')
  })
})
