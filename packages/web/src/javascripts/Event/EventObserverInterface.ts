import { ApplicationEvent } from '@standardnotes/snjs'

export interface EventObserverInterface {
  handle(event: ApplicationEvent): Promise<void>
}
