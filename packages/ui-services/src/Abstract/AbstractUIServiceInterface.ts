import { ApplicationEvent, ServiceInterface } from '@standardnotes/services'
import { VaultDisplayServiceEvent } from '../Vaults/VaultDisplayServiceEvent'

export interface AbstractUIServiceInterface extends ServiceInterface<VaultDisplayServiceEvent, unknown> {
  onAppStart(): Promise<void>
  onAppEvent(event: ApplicationEvent): Promise<void>
}
