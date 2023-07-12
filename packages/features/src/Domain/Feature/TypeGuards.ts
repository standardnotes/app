import { ContentType } from '@standardnotes/common'
import { AnyFeatureDescription } from './AnyFeatureDescription'
import { ThemeFeatureDescription } from './ThemeFeatureDescription'
import { EditorFeatureDescription } from './EditorFeatureDescription'
import { IframeComponentFeatureDescription } from './IframeComponentFeatureDescription'
import { ComponentFeatureDescription } from './ComponentFeatureDescription'
import { ComponentArea } from '../Component/ComponentArea'

export function isThemeFeatureDescription(feature: AnyFeatureDescription): feature is ThemeFeatureDescription {
  return 'content_type' in feature && feature.content_type === ContentType.Theme
}

export function isIframeComponentFeatureDescription(
  feature: AnyFeatureDescription,
): feature is IframeComponentFeatureDescription {
  return (
    'content_type' in feature &&
    feature.content_type === ContentType.Component &&
    [ComponentArea.Editor, ComponentArea.EditorStack].includes(feature.area)
  )
}

export function isEditorFeatureDescription(feature: AnyFeatureDescription): feature is EditorFeatureDescription {
  return (
    (feature as EditorFeatureDescription).note_type != undefined ||
    (feature as ComponentFeatureDescription).area === ComponentArea.Editor
  )
}
