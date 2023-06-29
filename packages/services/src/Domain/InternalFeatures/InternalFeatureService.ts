import { InternalFeature } from './InternalFeature'
import { InternalFeatureServiceInterface } from './InternalFeatureServiceInterface'

let sharedInstance: InternalFeatureServiceInterface | undefined

export class InternalFeatureService implements InternalFeatureServiceInterface {
  static get(): InternalFeatureServiceInterface {
    if (!sharedInstance) {
      sharedInstance = new InternalFeatureService()
    }
    return sharedInstance
  }

  private readonly enabledFeatures: Set<InternalFeature> = new Set()

  isFeatureEnabled(feature: InternalFeature): boolean {
    return this.enabledFeatures.has(feature)
  }

  enableFeature(feature: InternalFeature): void {
    console.warn(`Enabling internal feature: ${feature}`)
    this.enabledFeatures.add(feature)
  }
}
