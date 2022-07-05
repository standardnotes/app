import { PrefKey } from '../../../Syncable/UserPrefs/PrefKey'
import { AppDataField } from './AppDataField'

export const DefaultAppDomain = 'org.standardnotes.sn'
/* This domain will be used to save context item client data */
export const ComponentDataDomain = 'org.standardnotes.sn.components'

export type ItemDomainKey = typeof DefaultAppDomain | typeof ComponentDataDomain

export type AppDomainValueType = Partial<Record<AppDataField | PrefKey, unknown>>
export type ComponentDomainValueType = Record<string, unknown>
export type DomainDataValueType = AppDomainValueType | ComponentDomainValueType

export type AppData = {
  [DefaultAppDomain]: AppDomainValueType
  [ComponentDataDomain]?: ComponentDomainValueType
}
