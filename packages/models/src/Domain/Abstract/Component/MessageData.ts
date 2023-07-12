import { ComponentPermission } from '@standardnotes/features'

import { IncomingComponentItemPayload } from './IncomingComponentItemPayload'
import { KeyboardModifier } from './KeyboardModifier'

export type MessageData = Partial<{
  /** Related to the stream-item-context action */
  item?: IncomingComponentItemPayload
  /** Related to the stream-items action */
  content_types?: string[]
  items?: IncomingComponentItemPayload[]
  /** Related to the request-permission action */
  permissions?: ComponentPermission[]
  /** Related to the component-registered action */
  componentData?: Record<string, unknown>
  uuid?: string
  environment?: string
  platform?: string
  activeThemeUrls?: string[]
  /** Related to set-size action */
  width?: string | number
  height?: string | number
  type?: string
  /** Related to themes action */
  themes?: string[]
  /** Related to clear-selection action */
  content_type?: string
  /** Related to key-pressed action */
  keyboardModifier?: KeyboardModifier
}>
