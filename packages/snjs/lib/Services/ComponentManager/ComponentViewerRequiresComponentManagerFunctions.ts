import { UIFeature, ComponentPreferencesEntry } from '@standardnotes/models'
import { IframeComponentFeatureDescription } from '@standardnotes/features'
import { RunWithPermissionsUseCase } from './UseCase/RunWithPermissionsUseCase'

export interface ComponentViewerRequiresComponentManagerProperties {
  runWithPermissionsUseCase: RunWithPermissionsUseCase

  urlsForActiveThemes: () => string[]

  setComponentPreferences(
    component: UIFeature<IframeComponentFeatureDescription>,
    preferences: ComponentPreferencesEntry,
  ): Promise<void>

  getComponentPreferences(
    component: UIFeature<IframeComponentFeatureDescription>,
  ): ComponentPreferencesEntry | undefined
}
