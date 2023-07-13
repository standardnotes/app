import { UIFeature, EditorFeatureDescription, IframeComponentFeatureDescription } from '@standardnotes/snjs'

export type EditorMenuItem = {
  uiFeature: UIFeature<EditorFeatureDescription | IframeComponentFeatureDescription>
  isEntitled: boolean
  isLabs?: boolean
}
