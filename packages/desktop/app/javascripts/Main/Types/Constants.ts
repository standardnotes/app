/** Build-time constants */
declare const IS_SNAP: boolean

export const isSnap = IS_SNAP
export const autoUpdatingAvailable = !isSnap
export const keychainAccessIsUserConfigurable = isSnap
