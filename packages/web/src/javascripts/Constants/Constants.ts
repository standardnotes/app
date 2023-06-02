import { IconType } from '@standardnotes/snjs'

export const PANEL_NAME_NOTES = 'notes'
export const PANEL_NAME_NAVIGATION = 'navigation'

export const EMAIL_REGEX =
  /^([a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)$/

export const MENU_MARGIN_FROM_APP_BORDER = 5
export const MAX_MENU_SIZE_MULTIPLIER = 30

export const FOCUSABLE_BUT_NOT_TABBABLE = -1
export const NOTES_LIST_SCROLL_THRESHOLD = 200

export const MILLISECONDS_IN_A_DAY = 1000 * 60 * 60 * 24
export const DAYS_IN_A_WEEK = 7
export const DAYS_IN_A_YEAR = 365

export const BYTES_IN_ONE_KILOBYTE = 1_000
export const BYTES_IN_ONE_MEGABYTE = 1_000_000

export const TAG_FOLDERS_FEATURE_NAME = 'Tag folders'
export const TAG_FOLDERS_FEATURE_TOOLTIP = 'A Plus or Pro plan is required to enable Tag folders.'
export const SMART_TAGS_FEATURE_NAME = 'Smart Tags'

export const SYNC_TIMEOUT_DEBOUNCE = 350
export const SYNC_TIMEOUT_NO_DEBOUNCE = 100

type EditorMetadata = {
  name: string
  icon: IconType
  subtleIcon?: IconType
  iconClassName: string
  iconTintNumber: number
}

export const SuperEditorMetadata: EditorMetadata = {
  name: 'Super',
  icon: 'file-doc',
  subtleIcon: 'format-align-left',
  iconClassName: 'text-accessory-tint-1',
  iconTintNumber: 1,
}

export const PlainEditorMetadata: EditorMetadata = {
  name: 'Plain Text',
  icon: 'plain-text',
  iconClassName: 'text-accessory-tint-1',
  iconTintNumber: 1,
}
