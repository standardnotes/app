import { UserRequestType } from '@standardnotes/common'

import { RouteParser } from './RouteParser'
import { RouteType } from './RouteType'

describe('route parser', () => {
  it('routes to onboarding', () => {
    const url = 'https://app.standardnotes.com/onboard?from_homepage=true'
    const parser = new RouteParser(url)

    expect(parser.type).toEqual(RouteType.Onboarding)
    expect(parser.onboardingParams.fromHomepage).toEqual(true)
  })

  it('routes to demo', () => {
    const url = 'https://app-demo.standardnotes.com/?demo-token=eyJhY2Nlc3NUb2tl'
    const parser = new RouteParser(url)

    expect(parser.type).toEqual(RouteType.Demo)
    expect(parser.demoParams.token).toEqual('eyJhY2Nlc3NUb2tl')
  })

  it('routes to settings', () => {
    const url = 'https://app.standardnotes.com/?settings=account'
    const parser = new RouteParser(url)

    expect(parser.type).toEqual(RouteType.Settings)
    expect(parser.settingsParams.panel).toEqual('account')
  })

  it('routes to purchase', () => {
    const url = 'https://app.standardnotes.com/?purchase=true&plan=PLUS_PLAN&period=year'
    const parser = new RouteParser(url)

    expect(parser.type).toEqual(RouteType.Purchase)
    expect(parser.purchaseParams.period).toEqual('year')
    expect(parser.purchaseParams.plan).toEqual('PLUS_PLAN')
  })

  it('routes to none', () => {
    const url = 'https://app.standardnotes.com/unknown?foo=bar'
    const parser = new RouteParser(url)

    expect(parser.type).toEqual(RouteType.None)
  })

  it('accessing wrong params should throw', () => {
    const url = 'https://app.standardnotes.com/item?uuid=123'
    const parser = new RouteParser(url)

    expect(() => parser.onboardingParams).toThrowError('Accessing invalid params')
  })

  it('routes to subscription sharing', () => {
    const url = 'https://app.standardnotes.com/?accept-subscription-invite=1-2-3'
    const parser = new RouteParser(url)

    expect(parser.type).toEqual(RouteType.AcceptSubscriptionInvite)
    expect(parser.subscriptionInviteParams.inviteUuid).toEqual('1-2-3')
  })

  it('routes to user request', () => {
    const url = 'https://app.standardnotes.com/?user-request=exit-discount'
    const parser = new RouteParser(url)

    expect(parser.type).toEqual(RouteType.UserRequest)
    expect(parser.userRequestParams.requestType).toEqual(UserRequestType.ExitDiscount)
  })
})
