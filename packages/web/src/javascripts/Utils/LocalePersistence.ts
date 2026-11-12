const PENDING_LOCALE_SWITCH_KEY = 'sn-pending-locale-switch'
const SEEN_LABS_SPOTLIGHT_KEY = 'sn-has-seen-localization-spotlight'

/** Keyed per workspace, as each workspace has its own Labs setting. */
function localeStorageKey(workspaceIdentifier: string): string {
  return `sn-locale:${workspaceIdentifier}`
}

/** Persists the workspace's locale on this device for the next page load. */
export function persistLocale(workspaceIdentifier: string, locale: string): void {
  try {
    localStorage.setItem(localeStorageKey(workspaceIdentifier), locale)
  } catch {
    // Ignore quota / privacy errors
  }
}

/** Clears the persisted locale so Labs off does not leave a saved language choice. */
export function clearPersistedLocale(workspaceIdentifier: string): void {
  try {
    localStorage.removeItem(localeStorageKey(workspaceIdentifier))
  } catch {
    // Ignore privacy errors
  }
}

export function getPersistedLocale(workspaceIdentifier: string): string | undefined {
  try {
    return localStorage.getItem(localeStorageKey(workspaceIdentifier)) || undefined
  } catch {
    return undefined
  }
}

/** Shared by all workspaces, so dismissing the spotlight once hides it on this device. */
export function hasSeenLabsSpotlight(): boolean {
  try {
    return localStorage.getItem(SEEN_LABS_SPOTLIGHT_KEY) === 'true'
  } catch {
    return false
  }
}

export function markLabsSpotlightSeen(): void {
  try {
    localStorage.setItem(SEEN_LABS_SPOTLIGHT_KEY, 'true')
  } catch {
    // Ignore quota / privacy errors
  }
}

export function setPendingLocaleSwitch(locale: string): void {
  try {
    sessionStorage.setItem(PENDING_LOCALE_SWITCH_KEY, locale)
  } catch {
    return
  }
}

export function takePendingLocaleSwitch(): string | undefined {
  try {
    const locale = sessionStorage.getItem(PENDING_LOCALE_SWITCH_KEY)
    sessionStorage.removeItem(PENDING_LOCALE_SWITCH_KEY)
    return locale || undefined
  } catch {
    return undefined
  }
}
