import { ComponentOrNativeFeature, ComponentPreferencesEntry } from '@standardnotes/models'
import { RunWithPermissionsCallback } from './Types'
import { IframeComponentFeatureDescription } from '@standardnotes/features'

export interface ComponentViewerRequiresComponentManagerFunctions {
  runWithPermissions: RunWithPermissionsCallback
  urlsForActiveThemes: () => string[]
  setComponentPreferences(
    component: ComponentOrNativeFeature<IframeComponentFeatureDescription>,
    preferences: ComponentPreferencesEntry,
  ): Promise<void>
  getComponentPreferences(
    component: ComponentOrNativeFeature<IframeComponentFeatureDescription>,
  ): ComponentPreferencesEntry | undefined
}
