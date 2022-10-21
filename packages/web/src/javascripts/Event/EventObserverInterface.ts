import { ApplicationEvent } from '@standardnotes/snjs/dist/@types'

export interface EventObserverInterface {
  handle(event: ApplicationEvent): Promise<void>
}
