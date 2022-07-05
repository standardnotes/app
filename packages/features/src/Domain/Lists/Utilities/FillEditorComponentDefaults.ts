import { ComponentAction } from '../../Component/ComponentAction'
import { ContentType } from '@standardnotes/common'
import { EditorFeatureDescription } from '../../Feature/FeatureDescription'
import { ComponentArea } from '../../Component/ComponentArea'

export type RequiredEditorFields = Pick<EditorFeatureDescription, 'availableInSubscriptions'>

export function FillEditorComponentDefaults(
  component: Partial<EditorFeatureDescription> & RequiredEditorFields,
): EditorFeatureDescription {
  if (!component.index_path) {
    component.index_path = 'dist/index.html'
  }

  if (!component.component_permissions) {
    component.component_permissions = [
      {
        name: ComponentAction.StreamContextItem,
        content_types: [ContentType.Note],
      },
    ]
  }

  component.content_type = ContentType.Component
  if (!component.area) {
    component.area = ComponentArea.Editor
  }

  if (component.interchangeable == undefined) {
    component.interchangeable = true
  }

  return component as EditorFeatureDescription
}
