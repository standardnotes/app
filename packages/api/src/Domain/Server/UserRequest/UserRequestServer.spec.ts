import { UserRequestType } from '@standardnotes/common'

import { HttpServiceInterface } from '../../Http'
import { UserRequestResponse } from '../../Response/UserRequest/UserRequestResponse'

import { UserRequestServer } from './UserRequestServer'

describe('UserRequestServer', () => {
  let httpService: HttpServiceInterface

  const createServer = () => new UserRequestServer(httpService)

  beforeEach(() => {
    httpService = {} as jest.Mocked<HttpServiceInterface>
    httpService.post = jest.fn().mockReturnValue({
      data: { success: true },
    } as jest.Mocked<UserRequestResponse>)
  })

  it('should submit a user request', async () => {
    const response = await createServer().submitUserRequest({
      userUuid: '1-2-3',
      requestType: UserRequestType.ExitDiscount,
    })

    expect(response).toEqual({
      data: {
        success: true,
      },
    })
  })
})
