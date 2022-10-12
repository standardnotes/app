import { RoutePath } from './RoutePath'
import { RouteParser } from './RouteParser'

describe('route parser', () => {
  it('parses path with leading slash', () => {
    const url = 'https://app.standardnotes.com/item?uuid=123'
    const parser = new RouteParser(url)

    expect(parser.route).toEqual('/item')
  })

  it('routes to item', () => {
    const url = 'https://app.standardnotes.com/item?uuid=123'
    const parser = new RouteParser(url)

    expect(parser.route).toEqual(RoutePath.ItemLink)
    expect(parser.itemLinkParams.uuid).toEqual('123')
  })

  it('routes to onboarding', () => {
    const url = 'https://app.standardnotes.com/onboarding?from_homepage=true'
    const parser = new RouteParser(url)

    expect(parser.route).toEqual(RoutePath.Onboarding)
    expect(parser.onboardingParams.fromHomepage).toEqual(true)
  })

  it('routes to none', () => {
    const url = 'https://app.standardnotes.com/unknown?foo=bar'
    const parser = new RouteParser(url)

    expect(parser.route).toEqual(RoutePath.None)
  })

  it('accessing wrong params should throw', () => {
    const url = 'https://app.standardnotes.com/item?uuid=123'
    const parser = new RouteParser(url)

    expect(() => parser.onboardingParams).toThrowError('Accessing invalid params')
  })
})
