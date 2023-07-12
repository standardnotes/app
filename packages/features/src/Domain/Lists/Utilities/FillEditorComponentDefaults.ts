import { ContentType } from '@standardnotes/domain-core'

import { ComponentAction } from '../../Component/ComponentAction'
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
        content_types: [ContentType.TYPES.Note],
      },
    ]
  }

  component.content_type = ContentType.TYPES.Component
  if (!component.area) {
    component.area = ComponentArea.Editor
  }

  if (component.interchangeable == undefined) {
    component.interchangeable = true
  }

  return component as IframeComponentFeatureDescription
}
