import { ApplicationEvent, ApplicationServiceInterface } from '@standardnotes/services'

export interface AbstractUIServiceInterface<EventName = string, EventData = unknown>
  extends ApplicationServiceInterface<EventName, EventData> {
  onAppStart(): Promise<void>
  onAppEvent(event: ApplicationEvent): Promise<void>
}
