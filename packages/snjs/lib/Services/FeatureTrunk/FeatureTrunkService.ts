import { AbstractService, InternalEventBusInterface } from '@standardnotes/services'
import { FeatureTrunk } from './FeatureTrunk'

/**
 * The FeatureTrunk service offers availability information regarding in-development features.
 */
export class FeatureTrunkService extends AbstractService {
  private statuses: Record<FeatureTrunk, boolean> = {
    [FeatureTrunk.FeatureV005Protocol]: false,
  }

  constructor(protected override internalEventBus: InternalEventBusInterface) {
    super(internalEventBus)
  }

  isFeatureEnabled(feature: FeatureTrunk): boolean {
    return this.statuses[feature]
  }

  enableFeature(feature: FeatureTrunk): void {
    this.statuses[feature] = true
  }
}
