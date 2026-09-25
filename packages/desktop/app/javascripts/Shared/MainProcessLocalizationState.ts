export type MainProcessLocalizationState = {
  localizationEnabled: boolean
  /** Resolved locale from the renderer (e.g. fr_FR). Ignored when localization is off. */
  locale?: string | null
}
