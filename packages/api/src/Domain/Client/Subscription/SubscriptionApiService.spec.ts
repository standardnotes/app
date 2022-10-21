import { Invitation } from '@standardnotes/models'

import { SubscriptionInviteAcceptResponse } from '../../Response/Subscription/SubscriptionInviteAcceptResponse'
import { SubscriptionInviteCancelResponse } from '../../Response/Subscription/SubscriptionInviteCancelResponse'
import { SubscriptionInviteListResponse } from '../../Response/Subscription/SubscriptionInviteListResponse'
import { SubscriptionInviteResponse } from '../../Response/Subscription/SubscriptionInviteResponse'
import { SubscriptionServerInterface } from '../../Server/Subscription/SubscriptionServerInterface'

import { SubscriptionApiOperations } from './SubscriptionApiOperations'
import { SubscriptionApiService } from './SubscriptionApiService'

describe('SubscriptionApiService', () => {
  let subscriptionServer: SubscriptionServerInterface

  const createService = () => new SubscriptionApiService(subscriptionServer)

  beforeEach(() => {
    subscriptionServer = {} as jest.Mocked<SubscriptionServerInterface>
    subscriptionServer.invite = jest.fn().mockReturnValue({
      data: { success: true, sharedSubscriptionInvitationUuid: '1-2-3' },
    } as jest.Mocked<SubscriptionInviteResponse>)
    subscriptionServer.cancelInvite = jest.fn().mockReturnValue({
      data: { success: true },
    } as jest.Mocked<SubscriptionInviteCancelResponse>)
    subscriptionServer.listInvites = jest.fn().mockReturnValue({
      data: { invitations: [{} as jest.Mocked<Invitation>] },
    } as jest.Mocked<SubscriptionInviteListResponse>)
    subscriptionServer.acceptInvite = jest.fn().mockReturnValue({
      data: { success: true },
    } as jest.Mocked<SubscriptionInviteAcceptResponse>)
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
    Object.defineProperty(service, 'operationsInProgress', {
      get: () => new Map([[SubscriptionApiOperations.Inviting, true]]),
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

  it('should cancel an invite', async () => {
    const response = await createService().cancelInvite('1-2-3')

    expect(response).toEqual({
      data: {
        success: true,
      },
    })
    expect(subscriptionServer.cancelInvite).toHaveBeenCalledWith({
      api: '20200115',
      inviteUuid: '1-2-3',
    })
  })

  it('should not cancel an invite if it is already canceling', async () => {
    const service = createService()
    Object.defineProperty(service, 'operationsInProgress', {
      get: () => new Map([[SubscriptionApiOperations.CancelingInvite, true]]),
    })

    let error = null
    try {
      await service.cancelInvite('1-2-3')
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should not cancel an invite if the server fails', async () => {
    subscriptionServer.cancelInvite = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    let error = null
    try {
      await createService().cancelInvite('1-2-3')
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should list invites', async () => {
    const response = await createService().listInvites()

    expect(response).toEqual({
      data: {
        invitations: [{} as jest.Mocked<Invitation>],
      },
    })
    expect(subscriptionServer.listInvites).toHaveBeenCalledWith({
      api: '20200115',
    })
  })

  it('should not list invitations if it is already listing', async () => {
    const service = createService()
    Object.defineProperty(service, 'operationsInProgress', {
      get: () => new Map([[SubscriptionApiOperations.ListingInvites, true]]),
    })

    let error = null
    try {
      await service.listInvites()
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should not list invites if the server fails', async () => {
    subscriptionServer.listInvites = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    let error = null
    try {
      await createService().listInvites()
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should accept an invite', async () => {
    const response = await createService().acceptInvite('1-2-3')

    expect(response).toEqual({
      data: {
        success: true,
      },
    })
    expect(subscriptionServer.acceptInvite).toHaveBeenCalledWith({
      inviteUuid: '1-2-3',
    })
  })

  it('should not accept an invite if it is already accepting', async () => {
    const service = createService()
    Object.defineProperty(service, 'operationsInProgress', {
      get: () => new Map([[SubscriptionApiOperations.AcceptingInvite, true]]),
    })

    let error = null
    try {
      await service.acceptInvite('1-2-3')
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })

  it('should not accept an invite if the server fails', async () => {
    subscriptionServer.acceptInvite = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    let error = null
    try {
      await createService().acceptInvite('1-2-3')
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).not.toBeNull()
  })
})
