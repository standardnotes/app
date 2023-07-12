import { ComponentArea } from '@standardnotes/features'
import { SNComponent } from '../Component/Component'
import { ItemInterface } from '../../Abstract/Item'
import { ContentType } from '@standardnotes/domain-core'
import { useBoolean } from '@standardnotes/utils'
import { ThemePackageInfo } from '../Component/PackageInfo'
import { ThemeInterface } from './ThemeInterface'

export const isTheme = (x: ItemInterface): x is ThemeInterface => x.content_type === ContentType.TYPES.Theme

export class SNTheme extends SNComponent implements ThemeInterface {
  public override area: ComponentArea = ComponentArea.Themes
  public declare readonly package_info: ThemePackageInfo

  get layerable(): boolean {
    return useBoolean(this.package_info && this.package_info.layerable, false)
  }
}
