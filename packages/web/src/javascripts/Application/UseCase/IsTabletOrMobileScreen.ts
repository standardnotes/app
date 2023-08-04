import { isMobileScreen, isTabletOrMobileScreen, isTabletScreen } from '@/Utils'
import { Result, SyncUseCaseInterface } from '@standardnotes/snjs'
import { IsNativeMobileWeb } from '@standardnotes/ui-services'

export class IsTabletOrMobileScreen implements SyncUseCaseInterface<void> {
  constructor(private _isNativeMobileWeb: IsNativeMobileWeb) {}

  execute(): Result<void> {
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
