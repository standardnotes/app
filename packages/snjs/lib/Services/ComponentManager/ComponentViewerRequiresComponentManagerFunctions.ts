import { ComponentOrNativeFeature, ComponentPreferencesEntry } from '@standardnotes/models'
import { RunWithPermissionsCallback } from './Types'

export interface ComponentViewerRequiresComponentManagerFunctions {
  runWithPermissions: RunWithPermissionsCallback
  urlsForActiveThemes: () => string[]
  setComponentPreferences(component: ComponentOrNativeFeature, preferences: ComponentPreferencesEntry): Promise<void>
  getComponentPreferences(component: ComponentOrNativeFeature): ComponentPreferencesEntry | undefined
}
