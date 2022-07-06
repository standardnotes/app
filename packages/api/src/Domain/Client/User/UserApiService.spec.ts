import { ProtocolVersion } from '@standardnotes/common'
import { RootKeyParamsInterface } from '@standardnotes/models'
import { UserRegistrationResponse } from '../../Response/User/UserRegistrationResponse'
import { UserServerInterface } from '../../Server'
import { UserApiService } from './UserApiService'

describe('UserApiService', () => {
  let userServer: UserServerInterface
  let keyParams: RootKeyParamsInterface

  const createService = () => new UserApiService(userServer)

  beforeEach(() => {
    userServer = {} as jest.Mocked<UserServerInterface>
    userServer.register = jest.fn().mockReturnValue({
      data: { user: { email: 'test@test.te', uuid: '1-2-3' } },
    } as jest.Mocked<UserRegistrationResponse>)

    keyParams = {} as jest.Mocked<RootKeyParamsInterface>
    keyParams.getPortableValue = jest.fn().mockReturnValue({
      identifier: 'test@test.te',
      version: ProtocolVersion.V004,
    })
  })

  it('should register a user', async () => {
    const response = await createService().register('test@test.te', 'testpasswd', keyParams, false)

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
    Object.defineProperty(service, 'registering', {
      get: () => true,
    })

    let error = null
    try {
      await service.register('test@test.te', 'testpasswd', keyParams, false)
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
      await createService().register('test@test.te', 'testpasswd', keyParams, false)
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })
})
