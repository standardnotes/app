import { SubscriptionInviteResponse } from '../../Response/Subscription/SubscriptionInviteResponse'
import { SubscriptionServerInterface } from '../../Server/Subscription/SubscriptionServerInterface'

import { SubscriptionApiService } from './SubscriptionApiService'

describe('SubscriptionApiService', () => {
  let subscriptionServer: SubscriptionServerInterface

  const createService = () => new SubscriptionApiService(subscriptionServer)

  beforeEach(() => {
    subscriptionServer = {} as jest.Mocked<SubscriptionServerInterface>
    subscriptionServer.invite = jest.fn().mockReturnValue({
      data: { success: true, sharedSubscriptionInvitationUuid: '1-2-3' },
    } as jest.Mocked<SubscriptionInviteResponse>)
  })

  it('should invite a user', async () => {
    const response = await createService().invite('test@test.te')

    expect(response).toEqual({
      data: {
        success: true,
        sharedSubscriptionInvitationUuid: '1-2-3',
      },
    })
    expect(subscriptionServer.invite).toHaveBeenCalledWith({
      api: '20200115',
      identifier: 'test@test.te',
    })
  })

  it('should not invite a user if it is already inviting', async () => {
    const service = createService()
    Object.defineProperty(service, 'inviting', {
      get: () => true,
    })

    let error = null
    try {
      await service.invite('test@test.te')
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should not invite a user if the server fails', async () => {
    subscriptionServer.invite = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    let error = null
    try {
      await createService().invite('test@test.te')
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })
})
