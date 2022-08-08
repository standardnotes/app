import { DesktopManagerInterface } from '../Device/DesktopManagerInterface'
import { WebAppEvent } from '../Event/WebAppEvent'
import { ApplicationInterface } from './ApplicationInterface'

export interface WebApplicationInterface extends ApplicationInterface {
  notifyWebEvent(event: WebAppEvent, data?: unknown): void
  getDesktopService(): DesktopManagerInterface | undefined
}
