import { EditorFeatureDescription } from './EditorFeatureDescription'
import { ThemeFeatureDescription } from './ThemeFeatureDescription'
import { ComponentFeatureDescription } from './ComponentFeatureDescription'
import { IframeComponentFeatureDescription } from './IframeComponentFeatureDescription'
import { ClientFeatureDescription } from './ClientFeatureDescription'
import { ServerFeatureDescription } from './ServerFeatureDescription'

export type AnyFeatureDescription =
  | ComponentFeatureDescription
  | EditorFeatureDescription
  | ThemeFeatureDescription
  | IframeComponentFeatureDescription
  | ClientFeatureDescription
  | ServerFeatureDescription
