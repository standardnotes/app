export type NativeLocalizationState = {
  localizationEnabled: boolean
  /** Resolved locale from the web app (e.g. fr_FR). Ignored when localization is off. */
  locale?: string | null
}
