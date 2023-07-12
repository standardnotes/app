import { ComponentPermission } from '../Component/ComponentPermission'
import { ComponentFeatureDescription } from './ComponentFeatureDescription'
import { EditorFeatureDescription } from './EditorFeatureDescription'

export type IframeComponentFeatureDescription = (EditorFeatureDescription & ComponentFeatureDescription) & {
  component_permissions: ComponentPermission[]
}
