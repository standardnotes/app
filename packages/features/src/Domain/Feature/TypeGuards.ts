import { ContentType } from '@standardnotes/common'
import { AnyFeatureDescription } from './AnyFeatureDescription'
import { ThemeFeatureDescription } from './ThemeFeatureDescription'
import { EditorFeatureDescription } from './EditorFeatureDescription'
import { IframeComponentFeatureDescription } from './IframeComponentFeatureDescription'

export function isThemeFeatureDescription(feature: AnyFeatureDescription): feature is ThemeFeatureDescription {
  return 'content_type' in feature && feature.content_type === ContentType.Theme && 'index_path' in feature
}

export function isIframeComponentFeatureDescription(
  feature: AnyFeatureDescription,
): feature is IframeComponentFeatureDescription {
  return 'content_type' in feature && feature.content_type === ContentType.Component && 'index_path' in feature
}

export function isEditorFeatureDescription(feature: AnyFeatureDescription): feature is EditorFeatureDescription {
  return (feature as EditorFeatureDescription).note_type != undefined
}
