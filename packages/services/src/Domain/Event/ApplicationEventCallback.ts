import { ApplicationEvent } from './ApplicationEvent'

export type ApplicationEventCallback = (event: ApplicationEvent, data?: unknown) => Promise<void>
