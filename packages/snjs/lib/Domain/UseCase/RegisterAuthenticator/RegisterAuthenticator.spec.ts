import { AuthenticatorClientInterface } from '@standardnotes/services'

import { RegisterAuthenticator } from './RegisterAuthenticator'

describe('RegisterAuthenticator', () => {
  let authenticatorManager: AuthenticatorClientInterface
  let registrationPromptFunction: (
    publicKeyCredentialCreationOptions: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>

  const createUseCase = () => new RegisterAuthenticator(authenticatorManager, registrationPromptFunction)

  beforeEach(() => {
    authenticatorManager = {} as AuthenticatorClientInterface
    authenticatorManager.generateRegistrationOptions = jest.fn().mockReturnValue({ foo: 'bar' })
    authenticatorManager.verifyRegistrationResponse = jest.fn().mockReturnValue(true)

    registrationPromptFunction = jest.fn().mockReturnValue({ foo: 'bar' })
  })

  it('should return error if userUuid is not valid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: 'invalid',
      authenticatorName: 'my first device',
      username: 'test@test.te',
    })

    expect(result.isFailed()).toBeTruthy()
    expect(result.getError()).toEqual('Could not register authenticator: Given value is not a valid uuid: invalid')
  })

  it('should return error if username is not valid', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      authenticatorName: 'my first device',
      username: '',
    })

    expect(result.isFailed()).toBeTruthy()
    expect(result.getError()).toEqual('Could not register authenticator: Username cannot be empty')
  })

  it('should return error if registration options are not generated', async () => {
    authenticatorManager.generateRegistrationOptions = jest.fn().mockReturnValue(null)

    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      authenticatorName: 'my first device',
      username: 'test@test.te',
    })

    expect(result.isFailed()).toBeTruthy()
    expect(result.getError()).toEqual('Could not register authenticator: registration options are not generated.')
  })

  it('should return error if registration response is not verified', async () => {
    authenticatorManager.verifyRegistrationResponse = jest.fn().mockReturnValue(false)

    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      authenticatorName: 'my first device',
      username: 'test@test.te',
    })

    expect(result.isFailed()).toBeTruthy()
    expect(result.getError()).toEqual('Could not register authenticator: registration response is not verified.')
  })

  it('should return error if registration prompt function throws error', async () => {
    registrationPromptFunction = jest.fn().mockRejectedValue(new Error('Error'))

    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      authenticatorName: 'my first device',
      username: 'test@test.te',
    })

    expect(result.isFailed()).toBeTruthy()
    expect(result.getError()).toEqual('Could not register authenticator: Error')
  })

  it('should return an existing authenticator error if registration prompt function throws specific error', async () => {
    const error = new Error('Error')
    error.name = 'InvalidStateError'
    registrationPromptFunction = jest.fn().mockRejectedValue(error)

    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      authenticatorName: 'my first device',
      username: 'test@test.te',
    })

    expect(result.isFailed()).toBeTruthy()
    expect(result.getError()).toEqual('Could not register authenticator: already registered.')
  })

  it('should return success if authenticator is registered', async () => {
    const useCase = createUseCase()

    const result = await useCase.execute({
      userUuid: '00000000-0000-0000-0000-000000000000',
      authenticatorName: 'my first device',
      username: 'test@test.te',
    })

    expect(result.isFailed()).toBeFalsy()
    expect(result.getValue()).toBeTruthy()
  })
})
