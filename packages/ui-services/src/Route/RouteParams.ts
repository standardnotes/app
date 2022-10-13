import { PreferenceId } from '../Preferences/PreferenceId'

export type OnboardingParams = {
  fromHomepage: boolean
}

export type SettingsParams = {
  panel: PreferenceId
}

export type DemoParams = {
  token: string
}

export type PurchaseParams = {
  plan: string
  period: string
}
