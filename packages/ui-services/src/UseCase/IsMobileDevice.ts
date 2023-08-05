import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { IsNativeMobileWeb } from './IsNativeMobileWeb'
import { isAndroid, isIOS } from '../Utils/Utils'

export class IsMobileDevice implements SyncUseCaseInterface<boolean> {
  constructor(private _isNativeMobileWeb: IsNativeMobileWeb) {}

  execute(): Result<boolean> {
    return Result.ok(this._isNativeMobileWeb.execute().getValue() || isIOS() || isAndroid())
  }
}
