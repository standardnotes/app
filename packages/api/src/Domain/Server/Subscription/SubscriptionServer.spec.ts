import { ApiVersion } from '../../Api'
import { HttpServiceInterface } from '../../Http'
import { SubscriptionInviteResponse } from '../../Response'
import { SubscriptionServer } from './SubscriptionServer'

describe('SubscriptionServer', () => {
  let httpService: HttpServiceInterface

  const createServer = () => new SubscriptionServer(httpService)

  beforeEach(() => {
    httpService = {} as jest.Mocked<HttpServiceInterface>
    httpService.post = jest.fn().mockReturnValue({
      data: { success: true, sharedSubscriptionInvitationUuid: '1-2-3' },
    } as jest.Mocked<SubscriptionInviteResponse>)
  })

  it('should invite a user to a shared subscription', async () => {
    const response = await createServer().invite({
      api: ApiVersion.v0,
      identifier: 'test@test.te',
    })

    expect(response).toEqual({
      data: {
        success: true,
        sharedSubscriptionInvitationUuid: '1-2-3',
      },
    })
  })
})
