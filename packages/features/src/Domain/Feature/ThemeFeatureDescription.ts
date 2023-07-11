import { ThemeDockIcon } from '../Component/ThemeDockIcon'
import { ComponentFeatureDescription } from './ComponentFeatureDescription'

export type ThemeFeatureDescription = ComponentFeatureDescription & {
  /** Some themes can be layered on top of other themes */
  layerable?: boolean
  dock_icon?: ThemeDockIcon
  isDark?: boolean
}
