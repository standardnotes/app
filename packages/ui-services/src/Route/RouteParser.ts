import { PreferenceId } from './../Preferences/PreferenceId'
import { DemoParams, OnboardingParams, PurchaseParams, SettingsParams } from './RouteParams'
import { RouteType } from './RouteType'

enum RootRoutes {
  Onboarding = '/onboard',
  None = '/',
}

enum RootQueryParam {
  Purchase = 'purchase',
  Settings = 'settings',
  DemoToken = 'demo-token',
}

export class RouteParser {
  private url: URL
  private readonly path: string
  public readonly type: RouteType
  private readonly searchParams: URLSearchParams

  constructor(url: string) {
    this.url = new URL(url)
    this.path = this.url.pathname
    this.searchParams = this.url.searchParams

    const pathUsesRootQueryParams = this.path === RootRoutes.None

    if (pathUsesRootQueryParams) {
      if (this.searchParams.has(RootQueryParam.Purchase)) {
        this.type = RouteType.Purchase
      } else if (this.searchParams.has(RootQueryParam.Settings)) {
        this.type = RouteType.Settings
      } else if (this.searchParams.has(RootQueryParam.DemoToken)) {
        this.type = RouteType.Demo
      } else {
        this.type = RouteType.None
      }
    } else {
      if (this.path === RootRoutes.Onboarding) {
        this.type = RouteType.Onboarding
      } else {
        this.type = RouteType.None
      }
    }
  }

  get demoParams(): DemoParams {
    if (this.type !== RouteType.Demo) {
      throw new Error('Accessing invalid params')
    }

    return {
      token: this.searchParams.get(RootQueryParam.DemoToken) as string,
    }
  }

  get settingsParams(): SettingsParams {
    if (this.type !== RouteType.Settings) {
      throw new Error('Accessing invalid params')
    }

    return {
      panel: this.searchParams.get(RootQueryParam.Settings) as PreferenceId,
    }
  }

  get purchaseParams(): PurchaseParams {
    if (this.type !== RouteType.Purchase) {
      throw new Error('Accessing invalid params')
    }

    return {
      plan: this.searchParams.get('plan') as string,
      period: this.searchParams.get('period') as string,
    }
  }

  get onboardingParams(): OnboardingParams {
    if (this.type !== RouteType.Onboarding) {
      throw new Error('Accessing invalid params')
    }

    return {
      fromHomepage: !!this.searchParams.get('from_homepage'),
    }
  }
}
