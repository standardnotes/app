import { ComponentFeatureDescription } from './ComponentFeatureDescription'
import { EditorFeatureDescription } from './EditorFeatureDescription'
import { IframeComponentFeatureDescription } from './IframeComponentFeatureDescription'
import { ThemeFeatureDescription } from './ThemeFeatureDescription'

export type UIFeatureDescriptionTypes =
  | IframeComponentFeatureDescription
  | ThemeFeatureDescription
  | EditorFeatureDescription
  | ComponentFeatureDescription
