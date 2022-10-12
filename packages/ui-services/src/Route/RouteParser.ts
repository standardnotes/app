import { ItemLinkParams } from './ItemLinkParams'
import { OnboardingParams } from './OnboardingParams'
import { RoutePath } from './RoutePath'

export class RouteParser {
  private url: URL
  private readonly path: string
  public readonly route: RoutePath
  private readonly searchParams: URLSearchParams

  constructor(url: string) {
    this.url = new URL(url)
    this.path = this.url.pathname
    this.searchParams = this.url.searchParams

    if (this.path === RoutePath.Onboarding) {
      this.route = RoutePath.Onboarding
    } else if (this.path === RoutePath.ItemLink) {
      this.route = RoutePath.ItemLink
    } else {
      this.route = RoutePath.None
    }
  }

  get itemLinkParams(): ItemLinkParams {
    return {
      uuid: this.searchParams.get('uuid') as string,
    }
  }

  get onboardingParams(): OnboardingParams {
    if (this.route !== RoutePath.Onboarding) {
      throw new Error('Accessing invalid params')
    }

    return {
      fromHomepage: !!this.searchParams.get('from_homepage'),
    }
  }
}
