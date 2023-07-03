import { ApplicationEvent, ServiceInterface } from '@standardnotes/services'

export interface AbstractUIServiceInterface<EventName = string, EventData = unknown>
  extends ServiceInterface<EventName, EventData> {
  onAppStart(): Promise<void>
  onAppEvent(event: ApplicationEvent): Promise<void>
}
