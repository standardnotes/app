import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('subscriptions', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let subscriptionManager
  let subscriptionId = 3001

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithFakeCrypto()

    await context.launch()

    application = context.application
    subscriptionManager = context.application.subscriptionManager

    const result = await Factory.registerUserToApplication({
      application: application,
      email: context.email,
      password: context.password,
    })

    await Factory.publishMockedEvent('SUBSCRIPTION_PURCHASED', {
      userEmail: context.email,
      subscriptionId: subscriptionId++,
      subscriptionName: 'PRO_PLAN',
      subscriptionExpiresAt: (new Date().getTime() + 3_600_000) * 1_000,
      timestamp: Date.now(),
      offline: false,
      discountCode: null,
      limitedDiscountPurchased: false,
      newSubscriber: true,
      totalActiveSubscriptionsCount: 1,
      userRegisteredAt: 1,
      billingFrequency: 12,
      payAmount: 59.00
    })
    await Factory.sleep(2)
  })

  it('should invite a user by email to a shared subscription - @paidfeature', async () => {
    await subscriptionManager.inviteToSubscription('test@test.te')

    const existingInvites = await subscriptionManager.listSubscriptionInvitations()

    const newlyCreatedInvite = existingInvites.find(invite => invite.inviteeIdentifier === 'test@test.te')

    expect(newlyCreatedInvite.status).to.equal('sent')
  })

  it('should not invite a user by email if the limit of shared subscription is breached - @paidfeature', async () => {
    await subscriptionManager.inviteToSubscription('test1@test.te')
    await subscriptionManager.inviteToSubscription('test2@test.te')
    await subscriptionManager.inviteToSubscription('test3@test.te')
    await subscriptionManager.inviteToSubscription('test4@test.te')
    await subscriptionManager.inviteToSubscription('test5@test.te')

    let existingInvites = await subscriptionManager.listSubscriptionInvitations()

    expect(existingInvites.length).to.equal(5)

    expect(await subscriptionManager.inviteToSubscription('test6@test.te')).to.equal(false)

    existingInvites = await subscriptionManager.listSubscriptionInvitations()

    expect(existingInvites.length).to.equal(5)
  })

  it('should cancel a user invitation to a shared subscription - @paidfeature', async () => {
    await subscriptionManager.inviteToSubscription('test@test.te')
    await subscriptionManager.inviteToSubscription('test2@test.te')

    let existingInvites = await subscriptionManager.listSubscriptionInvitations()

    expect (existingInvites.length).to.equal(2)

    const newlyCreatedInvite = existingInvites.find(invite => invite.inviteeIdentifier === 'test@test.te')

    await subscriptionManager.cancelInvitation(newlyCreatedInvite.uuid)

    existingInvites = await subscriptionManager.listSubscriptionInvitations()

    expect (existingInvites.length).to.equal(2)

    expect(existingInvites.filter(invite => invite.status === 'canceled').length).to.equal(1)
  })

  it('should invite a user by email if the limit of shared subscription is restored - @paidfeature', async () => {
    await subscriptionManager.inviteToSubscription('test1@test.te')
    await subscriptionManager.inviteToSubscription('test2@test.te')
    await subscriptionManager.inviteToSubscription('test3@test.te')
    await subscriptionManager.inviteToSubscription('test4@test.te')
    await subscriptionManager.inviteToSubscription('test5@test.te')

    let existingInvites = await subscriptionManager.listSubscriptionInvitations()

    expect(existingInvites.length).to.equal(5)

    await subscriptionManager.cancelInvitation(existingInvites[0].uuid)

    expect(await subscriptionManager.inviteToSubscription('test6@test.te')).to.equal(true)

    existingInvites = await subscriptionManager.listSubscriptionInvitations()

    expect(existingInvites.find(invite => invite.inviteeIdentifier === 'test6@test.te')).not.to.equal(undefined)
  })
})
