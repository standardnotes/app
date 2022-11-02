import { UserRequestType, Uuid } from '@standardnotes/common'
import { PreferenceId } from './../Preferences/PreferenceId'
import { DemoParams } from './Params/DemoParams'
import { OnboardingParams } from './Params/OnboardingParams'
import { PurchaseParams } from './Params/PurchaseParams'
import { SettingsParams } from './Params/SettingsParams'
import { SubscriptionInviteParams } from './Params/SubscriptionInviteParams'
import { UserRequestParams } from './Params/UserRequestParams'

import { RootQueryParam } from './RootQueryParam'
import { RootRoutes } from './RootRoutes'
import { RouteParserInterface } from './RouteParserInterface'
import { RouteType } from './RouteType'

export class RouteParser implements RouteParserInterface {
  private url: URL
  private readonly path: string
  private readonly parsedType: RouteType
  private readonly searchParams: URLSearchParams

  constructor(url: string) {
    this.url = new URL(url)
    this.path = this.url.pathname
    this.searchParams = this.url.searchParams
    this.parsedType = this.parseTypeFromQueryParameters()
  }

  get type(): RouteType {
    return this.parsedType
  }

  get userRequestParams(): UserRequestParams {
    this.checkForProperRouteType(RouteType.UserRequest)

    return {
      requestType: this.searchParams.get(RootQueryParam.UserRequest) as UserRequestType,
    }
  }

  get subscriptionInviteParams(): SubscriptionInviteParams {
    this.checkForProperRouteType(RouteType.AcceptSubscriptionInvite)

    return {
      inviteUuid: this.searchParams.get(RootQueryParam.AcceptSubscriptionInvite) as Uuid,
    }
  }

  get demoParams(): DemoParams {
    this.checkForProperRouteType(RouteType.Demo)

    return {
      token: this.searchParams.get(RootQueryParam.DemoToken) as string,
    }
  }

  get settingsParams(): SettingsParams {
    this.checkForProperRouteType(RouteType.Settings)

    return {
      panel: this.searchParams.get(RootQueryParam.Settings) as PreferenceId,
    }
  }

  get purchaseParams(): PurchaseParams {
    this.checkForProperRouteType(RouteType.Purchase)

    return {
      plan: this.searchParams.get('plan') as string,
      period: this.searchParams.get('period') as string,
    }
  }

  get onboardingParams(): OnboardingParams {
    this.checkForProperRouteType(RouteType.Onboarding)

    return {
      fromHomepage: !!this.searchParams.get('from_homepage'),
    }
  }

  private checkForProperRouteType(type: RouteType): void {
    if (this.parsedType !== type) {
      throw new Error('Accessing invalid params')
    }
  }

  private parseTypeFromQueryParameters(): RouteType {
    if (this.path === RootRoutes.Onboarding) {
      return RouteType.Onboarding
    }

    if (this.path !== RootRoutes.None) {
      return RouteType.None
    }

    const rootQueryParametersMap: Map<RootQueryParam, RouteType> = new Map([
      [RootQueryParam.Purchase, RouteType.Purchase],
      [RootQueryParam.Settings, RouteType.Settings],
      [RootQueryParam.DemoToken, RouteType.Demo],
      [RootQueryParam.AcceptSubscriptionInvite, RouteType.AcceptSubscriptionInvite],
      [RootQueryParam.UserRequest, RouteType.UserRequest],
    ])

    for (const rootQueryParam of rootQueryParametersMap.keys()) {
      if (this.searchParams.has(rootQueryParam)) {
        return rootQueryParametersMap.get(rootQueryParam) as RouteType
      }
    }

    return RouteType.None
  }
}
