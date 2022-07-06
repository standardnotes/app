import { ProtocolVersion } from '@standardnotes/common'
import { ApiVersion } from '../../Api'
import { HttpServiceInterface } from '../../Http'
import { UserRegistrationResponse } from '../../Response'
import { UserServer } from './UserServer'

describe('UserServer', () => {
  let httpService: HttpServiceInterface

  const createServer = () => new UserServer(httpService)

  beforeEach(() => {
    httpService = {} as jest.Mocked<HttpServiceInterface>
    httpService.post = jest.fn().mockReturnValue({
      data: { user: { email: 'test@test.te', uuid: '1-2-3' } },
    } as jest.Mocked<UserRegistrationResponse>)
  })

  it('should register a user', async () => {
    const response = await createServer().register({
      password: 'test',
      api: ApiVersion.v0,
      email: 'test@test.te',
      ephemeral: false,
      version: ProtocolVersion.V004,
      pw_nonce: 'test',
      identifier: 'test@test.te',
    })

    expect(response).toEqual({
      data: {
        user: {
          email: 'test@test.te',
          uuid: '1-2-3',
        },
      },
    })
  })
})
