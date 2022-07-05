import { ApplicationStage } from '../Application/ApplicationStage'
import { ServiceDiagnostics } from '../Diagnostics/ServiceDiagnostics'
import { EventObserver } from '../Event/EventObserver'

export interface ServiceInterface<E, D> extends ServiceDiagnostics {
  loggingEnabled: boolean
  addEventObserver(observer: EventObserver<E, D>): () => void
  blockDeinit(): Promise<void>
  deinit(): void
  handleApplicationStage(stage: ApplicationStage): Promise<void>
  log(message: string, ...args: unknown[]): void
}
