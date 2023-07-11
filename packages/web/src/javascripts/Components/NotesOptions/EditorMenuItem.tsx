import {
  ComponentOrNativeFeature,
  EditorFeatureDescription,
  IframeComponentFeatureDescription,
} from '@standardnotes/snjs'

export type EditorMenuItem = {
  uiFeature: ComponentOrNativeFeature<EditorFeatureDescription | IframeComponentFeatureDescription>
  isEntitled: boolean
  isLabs?: boolean
}
