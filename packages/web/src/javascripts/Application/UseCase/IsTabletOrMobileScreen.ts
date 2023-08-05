import { isMobileScreen, isTabletOrMobileScreen, isTabletScreen } from '@/Utils'
import { Environment, Result, SyncUseCaseInterface } from '@standardnotes/snjs'
import { IsNativeMobileWeb } from '@standardnotes/ui-services'

type ReturnType = {
  isTabletOrMobile: boolean
  isTablet: boolean
  isMobile: boolean
}

export class IsTabletOrMobileScreen implements SyncUseCaseInterface<ReturnType> {
  private _isNativeMobileWeb = new IsNativeMobileWeb(this.environment)

  constructor(private environment: Environment) {}

  execute(): Result<ReturnType> {
    const isNativeMobile = this._isNativeMobileWeb.execute().getValue()
    const isTabletOrMobile = isTabletOrMobileScreen() || isNativeMobile
    const isTablet = isTabletScreen() || (isNativeMobile && !isMobileScreen())
    const isMobile = isMobileScreen() || (isNativeMobile && !isTablet)

    if (isTablet && isMobile) {
      throw Error('isTablet and isMobile cannot both be true')
    }

    return Result.ok({
      isTabletOrMobile,
      isTablet,
      isMobile,
    })
  }
}
