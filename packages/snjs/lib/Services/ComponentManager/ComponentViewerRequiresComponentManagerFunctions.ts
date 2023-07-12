import { UIFeature, ComponentPreferencesEntry } from '@standardnotes/models'
import { RunWithPermissionsCallback } from './Types'
import { IframeComponentFeatureDescription } from '@standardnotes/features'

export interface ComponentViewerRequiresComponentManagerFunctions {
  runWithPermissions: RunWithPermissionsCallback
  urlsForActiveThemes: () => string[]
  setComponentPreferences(
    component: UIFeature<IframeComponentFeatureDescription>,
    preferences: ComponentPreferencesEntry,
  ): Promise<void>
  getComponentPreferences(
    component: UIFeature<IframeComponentFeatureDescription>,
  ): ComponentPreferencesEntry | undefined
}
