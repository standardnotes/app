import { ComponentAction } from '@standardnotes/features'
import { MessageData } from './MessageData'

export type ActionObserver = (action: ComponentAction, messageData: MessageData) => void
