import { ComponentArea } from '../Component/ComponentArea'
import { BaseFeatureDescription } from './BaseFeatureDescription'

export type ComponentFeatureDescription = BaseFeatureDescription & {
  /** The relative path of the index.html file or the main css file if theme, within the component folder itself */
  index_path: string
  content_type: string
  area: ComponentArea
}
