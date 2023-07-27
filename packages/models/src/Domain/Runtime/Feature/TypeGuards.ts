import {
  AnyFeatureDescription,
  EditorFeatureDescription,
  IframeComponentFeatureDescription,
  UIFeatureDescriptionTypes,
  isIframeComponentFeatureDescription,
} from '@standardnotes/features'
import { UIFeatureInterface } from './UIFeatureInterface'
import { ComponentInterface } from '../../Syncable/Component'

export function isUIFeatureAnIframeFeature(
  x: UIFeatureInterface<EditorFeatureDescription | IframeComponentFeatureDescription>,
): x is UIFeatureInterface<IframeComponentFeatureDescription> {
  return isIframeComponentFeatureDescription(x.featureDescription)
}

export function isItemBasedFeature(x: ComponentInterface | UIFeatureDescriptionTypes): x is ComponentInterface {
  return 'uuid' in x
}

export function isNativeFeature(x: ComponentInterface | AnyFeatureDescription): x is AnyFeatureDescription {
  return !('uuid' in x)
}
