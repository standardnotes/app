import { ComponentAction } from '@standardnotes/features'
import { MessageData } from './MessageData'

export type ComponentMessage = {
  action: ComponentAction
  sessionKey?: string
  componentData?: Record<string, unknown>
  data: MessageData
}
