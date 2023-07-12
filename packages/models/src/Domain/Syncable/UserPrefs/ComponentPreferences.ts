import { FeatureIdentifier } from '@standardnotes/features'

type UuidString = string

export type AllComponentPreferences = Record<FeatureIdentifier | UuidString, ComponentPreferencesEntry>

export type ComponentPreferencesEntry = Record<string, unknown>
