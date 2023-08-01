import { ServiceDiagnostics } from '../Diagnostics/ServiceDiagnostics'
import { EventObserver } from '../Event/EventObserver'

export interface ApplicationServiceInterface<E, D> extends ServiceDiagnostics {
  loggingEnabled: boolean
  addEventObserver(observer: EventObserver<E, D>): () => void
  blockDeinit(): Promise<void>
  deinit(): void
}
