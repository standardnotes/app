import { SubscriptionApiServiceInterface } from '@standardnotes/api'
import { Invitation } from '@standardnotes/models'
import { InternalEventBusInterface } from '..'
import { SubscriptionManager } from './SubscriptionManager'

describe('SubscriptionManager', () => {
  let subscriptionApiService: SubscriptionApiServiceInterface
  let internalEventBus: InternalEventBusInterface

  const createManager = () => new SubscriptionManager(subscriptionApiService, internalEventBus)

  beforeEach(() => {
    subscriptionApiService = {} as jest.Mocked<SubscriptionApiServiceInterface>
    subscriptionApiService.cancelInvite = jest.fn()
    subscriptionApiService.invite = jest.fn()
    subscriptionApiService.listInvites = jest.fn()

    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
  })

  it('should invite user by email to a shared subscription', async () => {
    subscriptionApiService.invite = jest.fn().mockReturnValue({ data: { success: true }})

    expect(await createManager().inviteToSubscription('test@test.te')).toBeTruthy()
  })

  it('should not invite user by email if the api fails to do so', async () => {
    subscriptionApiService.invite = jest.fn().mockReturnValue({ data: { error: 'foobar' }})

    expect(await createManager().inviteToSubscription('test@test.te')).toBeFalsy()
  })

  it('should not invite user by email if the api throws an error', async () => {
    subscriptionApiService.invite = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    expect(await createManager().inviteToSubscription('test@test.te')).toBeFalsy()
  })

  it('should cancel invite to a shared subscription', async () => {
    subscriptionApiService.cancelInvite = jest.fn().mockReturnValue({ data: { success: true }})

    expect(await createManager().cancelInvitation('1-2-3')).toBeTruthy()
  })

  it('should not cancel invite if the api fails to do so', async () => {
    subscriptionApiService.cancelInvite = jest.fn().mockReturnValue({ data: { error: 'foobar' }})

    expect(await createManager().cancelInvitation('1-2-3')).toBeFalsy()
  })

  it('should not cancel invite if the api throws an error', async () => {
    subscriptionApiService.cancelInvite = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    expect(await createManager().cancelInvitation('1-2-3')).toBeFalsy()
  })

  it('should list invites to a shared subscription', async () => {
    const invitation = {
      uuid: '1-2-3',
    } as jest.Mocked<Invitation>
    subscriptionApiService.listInvites = jest.fn().mockReturnValue({ data: { invitations: [invitation] }})

    expect(await createManager().listSubscriptionInvitations()).toEqual([ invitation ])
  })

  it('should return an empty list of invites if the api fails to fetch them', async () => {
    subscriptionApiService.listInvites = jest.fn().mockReturnValue({ data: { error: 'foobar' }})

    expect(await createManager().listSubscriptionInvitations()).toEqual([])
  })

  it('should return an empty list of invites if the api throws an error', async () => {
    subscriptionApiService.listInvites = jest.fn().mockImplementation(() => {
      throw new Error('Oops')
    })

    expect(await createManager().listSubscriptionInvitations()).toEqual([])
  })
})
