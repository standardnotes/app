import { ComponentInterface } from '../Component'
import { ThemePackageInfo } from '../Component/PackageInfo'

export interface ThemeInterface extends ComponentInterface {
  get layerable(): boolean
  readonly package_info: ThemePackageInfo
}
