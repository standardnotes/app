import { ProtocolVersion, UserRequestType } from '@standardnotes/common'
import { RootKeyParamsInterface } from '@standardnotes/models'
import { UserDeletionResponse } from '../../Response/User/UserDeletionResponse'

import { UserRegistrationResponse } from '../../Response/User/UserRegistrationResponse'
import { UserRequestResponse } from '../../Response/UserRequest/UserRequestResponse'
import { UserServerInterface } from '../../Server'
import { UserRequestServerInterface } from '../../Server/UserRequest/UserRequestServerInterface'

import { UserApiOperations } from './UserApiOperations'
import { UserApiService } from './UserApiService'

describe('UserApiService', () => {
  let userServer: UserServerInterface
  let userRequestServer: UserRequestServerInterface
  let keyParams: RootKeyParamsInterface

  const createService = () => new UserApiService(userServer, userRequestServer)

  beforeEach(() => {
    userServer = {} as jest.Mocked<UserServerInterface>
    userServer.register = jest.fn().mockReturnValue({
      data: { user: { email: 'test@test.te', uuid: '1-2-3' } },
    } as jest.Mocked<UserRegistrationResponse>)
    userServer.deleteAccount = jest.fn().mockReturnValue({
      data: { message: 'Success' },
    } as jest.Mocked<UserDeletionResponse>)

    userRequestServer = {} as jest.Mocked<UserRequestServerInterface>
    userRequestServer.submitUserRequest = jest.fn().mockReturnValue({
      data: { success: true },
    } as jest.Mocked<UserRequestResponse>)

    keyParams = {} as jest.Mocked<RootKeyParamsInterface>
    keyParams.getPortableValue = jest.fn().mockReturnValue({
      identifier: 'test@test.te',
      version: ProtocolVersion.V004,
    })
  })

  it('should register a user', async () => {
    const response = await createService().register({
      email: 'test@test.te',
      serverPassword: 'testpasswd',
      keyParams,
      ephemeral: false,
    })

    expect(response).toEqual({
      data: {
        user: {
          email: 'test@test.te',
          uuid: '1-2-3',
        },
      },
    })
    expect(userServer.register).toHaveBeenCalledWith({
      api: '20200115',
      email: 'test@test.te',
      ephemeral: false,
      identifier: 'test@test.te',
      password: 'testpasswd',
      version: '004',
    })
  })

  it('should not register a user if it is already registering', async () => {
    const service = createService()
    Object.defineProperty(service, 'operationsInProgress', {
      get: () => new Map([[UserApiOperations.Registering, true]]),
    })

    let error = null
    try {
      await service.register({ email: 'test@test.te', serverPassword: 'testpasswd', keyParams, ephemeral: false })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should not register a user if the server fails', async () => {
    userServer.register = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    let error = null
    try {
      await createService().register({
        email: 'test@test.te',
        serverPassword: 'testpasswd',
        keyParams,
        ephemeral: false,
      })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should submit a user request', async () => {
    const response = await createService().submitUserRequest({
      userUuid: '1-2-3',
      requestType: UserRequestType.ExitDiscount,
    })

    expect(response).toEqual({
      data: {
        success: true,
      },
    })
    expect(userRequestServer.submitUserRequest).toHaveBeenCalledWith({
      userUuid: '1-2-3',
      requestType: UserRequestType.ExitDiscount,
    })
  })

  it('should not submit a user request if it is already submitting', async () => {
    const service = createService()
    Object.defineProperty(service, 'operationsInProgress', {
      get: () => new Map([[UserApiOperations.SubmittingRequest, true]]),
    })

    let error = null
    try {
      await service.submitUserRequest({ userUuid: '1-2-3', requestType: UserRequestType.ExitDiscount })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should not submit a user request if the server fails', async () => {
    userRequestServer.submitUserRequest = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    let error = null
    try {
      await createService().submitUserRequest({
        userUuid: '1-2-3',
        requestType: UserRequestType.ExitDiscount,
      })
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should delete a user', async () => {
    const response = await createService().deleteAccount('1-2-3')

    expect(response).toEqual({
      data: {
        message: 'Success',
      },
    })
    expect(userServer.deleteAccount).toHaveBeenCalledWith({
      userUuid: '1-2-3',
    })
  })

  it('should not delete a user if it is already deleting', async () => {
    const service = createService()
    Object.defineProperty(service, 'operationsInProgress', {
      get: () => new Map([[UserApiOperations.DeletingAccount, true]]),
    })

    let error = null
    try {
      await service.deleteAccount('1-2-3')
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should not delete a user if the server fails', async () => {
    userServer.deleteAccount = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    let error = null
    try {
      await createService().deleteAccount('1-2-3')
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })
})
