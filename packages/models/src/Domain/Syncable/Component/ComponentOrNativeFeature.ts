import { ComponentArea, FeatureIdentifier, FindNativeFeature } from '@standardnotes/features'

export type ComponentOrNativeFeature = NonNativeComponent | NativeComponent

interface AnyComponent {
  uuid: string
  identifier: FeatureIdentifier
  name: string
  area: ComponentArea

  displayName: string
  valid_until: Date
  deprecationMessage?: string

  get userPreferencesLookupKey(): string

  get perItemPreferencesLookupKey(): string
}

export interface NonNativeComponent extends AnyComponent {
  local_url?: string
  hosted_url?: string
  legacy_url?: string

  offlineOnly: boolean

  hasValidHostedUrl(): boolean
}

export interface NativeComponent extends AnyComponent {
  isNativeComponent: true
}

export function isNativeComponent(component: ComponentOrNativeFeature): component is NativeComponent {
  return FindNativeFeature(component.identifier) != undefined
}

export function isNonNativeComponent(component: ComponentOrNativeFeature): component is NonNativeComponent {
  return FindNativeFeature(component.identifier) == undefined
}
