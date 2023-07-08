import {
  ComponentPermission,
  EditorFeatureDescription,
  FeatureDescription,
  NoteType,
  ThemeFeatureDescription,
} from '@standardnotes/features'
import { ComponentInterface } from './ComponentInterface'
import { isComponent } from './Component'
import { DecryptedItemInterface, isDecryptedItem } from '../../Abstract/Item'
import { ContentType } from '@standardnotes/common'
import { ThemeInterface } from '../Theme'

export type ComponentOrNativeFeature = ComponentInterface | FeatureDescription

export type ComponentOrNativeTheme = ThemeInterface | ThemeFeatureDescription

export function isNativeComponent(component: ComponentOrNativeFeature): component is FeatureDescription {
  if (isDecryptedItem(component as DecryptedItemInterface)) {
    return false
  }

  return 'index_path' in component
}

export function isNativeTheme(component: ComponentOrNativeFeature): component is ThemeFeatureDescription {
  return isNativeComponent(component) && (component as ThemeFeatureDescription).content_type === ContentType.Theme
}

export function isNativeEditorComponent(component: ComponentOrNativeFeature): component is EditorFeatureDescription {
  return isNativeComponent(component) && (component as EditorFeatureDescription).note_type != undefined
}

export function isNonNativeComponent(component: ComponentOrNativeFeature): component is ComponentInterface {
  if (!isDecryptedItem(component as DecryptedItemInterface)) {
    return false
  }

  return isComponent(component as DecryptedItemInterface)
}

export type ComponentOrNativeFeatureUniqueIdentifier = ComponentInterface['uuid'] | FeatureDescription['identifier']

export function getComponentOrNativeFeatureUniqueIdentifier(
  component: ComponentOrNativeFeature,
): ComponentOrNativeFeatureUniqueIdentifier {
  if (isNativeComponent(component)) {
    return component.identifier
  } else {
    return component.uuid
  }
}

export function getComponentOrNativeFeatureNoteType(component: ComponentOrNativeFeature): NoteType {
  if (isNativeComponent(component)) {
    return component.note_type ?? NoteType.Unknown
  } else {
    return component.noteType
  }
}

export function getComponentOrNativeFeatureFileType(
  component: ComponentOrNativeFeature,
): FeatureDescription['file_type'] | undefined {
  if (isNativeComponent(component)) {
    return component.file_type
  } else {
    return component.package_info?.file_type
  }
}

export function getComponentOrNativeFeatureDisplayName(component: ComponentOrNativeFeature): string {
  if (isNativeComponent(component)) {
    return component.name ?? ''
  } else {
    return component.displayName
  }
}

export function getComponentOrNativeFeatureDeprecationMessage(component: ComponentOrNativeFeature): string | undefined {
  if (isNativeComponent(component)) {
    return component.deprecation_message
  } else {
    return component.deprecationMessage
  }
}

export function getComponentOrNativeFeatureExpirationDate(component: ComponentOrNativeFeature): Date | undefined {
  if (isNativeComponent(component)) {
    return component.expires_at ? new Date(component.expires_at) : undefined
  } else {
    return component.valid_until
  }
}

export function getComponentOrNativeFeatureFeatureDescription(component: ComponentOrNativeFeature): FeatureDescription {
  if (isNativeComponent(component)) {
    return component
  } else {
    return component.package_info
  }
}

export function getComponentOrNativeFeatureAcquiredPermissions(
  component: ComponentOrNativeFeature,
): ComponentPermission[] {
  if (isNativeComponent(component)) {
    return component.component_permissions ?? []
  } else {
    return component.permissions
  }
}
