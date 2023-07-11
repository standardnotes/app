import { ComponentAction } from '../../Component/ComponentAction'
import { ContentType } from '@standardnotes/common'
import { EditorFeatureDescription } from '../../Feature/EditorFeatureDescription'
import { IframeComponentFeatureDescription } from '../../Feature/IframeComponentFeatureDescription'
import { ComponentArea } from '../../Component/ComponentArea'

export type RequiredEditorFields = Pick<EditorFeatureDescription, 'availableInRoles'>

export function FillIframeEditorDefaults(
  component: Partial<IframeComponentFeatureDescription> & RequiredEditorFields,
): IframeComponentFeatureDescription {
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

  return component as IframeComponentFeatureDescription
}
