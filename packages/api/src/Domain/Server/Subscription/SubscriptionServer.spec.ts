import { Invitation } from '@standardnotes/models'

import { ApiVersion } from '../../Api'
import { HttpServiceInterface } from '../../Http'
import { SubscriptionInviteResponse } from '../../Response'
import { SubscriptionInviteAcceptResponse } from '../../Response/Subscription/SubscriptionInviteAcceptResponse'
import { SubscriptionInviteCancelResponse } from '../../Response/Subscription/SubscriptionInviteCancelResponse'
import { SubscriptionInviteDeclineResponse } from '../../Response/Subscription/SubscriptionInviteDeclineResponse'
import { SubscriptionInviteListResponse } from '../../Response/Subscription/SubscriptionInviteListResponse'

import { SubscriptionServer } from './SubscriptionServer'

describe('SubscriptionServer', () => {
  let httpService: HttpServiceInterface

  const createServer = () => new SubscriptionServer(httpService)

  beforeEach(() => {
    httpService = {} as jest.Mocked<HttpServiceInterface>
  })

  it('should invite a user to a shared subscription', async () => {
    httpService.post = jest.fn().mockReturnValue({
      data: { success: true, sharedSubscriptionInvitationUuid: '1-2-3' },
    } as jest.Mocked<SubscriptionInviteResponse>)

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

  it('should accept an invite to a shared subscription', async () => {
    httpService.post = jest.fn().mockReturnValue({
      data: { success: true },
    } as jest.Mocked<SubscriptionInviteAcceptResponse>)

    const response = await createServer().acceptInvite({
      api: ApiVersion.v0,
      inviteUuid: '1-2-3',
    })

    expect(response).toEqual({
      data: {
        success: true,
      },
    })
  })

  it('should decline an invite to a shared subscription', async () => {
    httpService.get = jest.fn().mockReturnValue({
      data: { success: true },
    } as jest.Mocked<SubscriptionInviteDeclineResponse>)

    const response = await createServer().declineInvite({
      api: ApiVersion.v0,
      inviteUuid: '1-2-3',
    })

    expect(response).toEqual({
      data: {
        success: true,
      },
    })
  })

  it('should cancel an invite to a shared subscription', async () => {
    httpService.delete = jest.fn().mockReturnValue({
      data: { success: true },
    } as jest.Mocked<SubscriptionInviteCancelResponse>)

    const response = await createServer().cancelInvite({
      api: ApiVersion.v0,
      inviteUuid: '1-2-3',
    })

    expect(response).toEqual({
      data: {
        success: true,
      },
    })
  })

  it('should list invitations to a shared subscription', async () => {
    httpService.get = jest.fn().mockReturnValue({
      data: { invitations: [{} as jest.Mocked<Invitation>] },
    } as jest.Mocked<SubscriptionInviteListResponse>)

    const response = await createServer().listInvites({
      api: ApiVersion.v0,
    })

    expect(response).toEqual({
      data: {
        invitations: [{} as jest.Mocked<Invitation>],
      },
    })
  })
})
