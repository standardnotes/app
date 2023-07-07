import { FeatureDescription, FindNativeFeature, NoteType } from '@standardnotes/features'
import { ComponentInterface } from './ComponentInterface'

export type ComponentOrNativeFeature = ComponentInterface | FeatureDescription

export function isNativeComponent(component: ComponentOrNativeFeature): component is FeatureDescription {
  return FindNativeFeature(component.identifier) != undefined
}

export function isNonNativeComponent(component: ComponentOrNativeFeature): component is ComponentInterface {
  return FindNativeFeature(component.identifier) == undefined
}

export function getComponentOrNativeFeatureUniqueIdentifier(component: ComponentOrNativeFeature): string {
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
