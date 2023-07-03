import { InternalFeature, InternalFeatureService } from '@standardnotes/snjs'
import { WebApplicationInterface } from '@standardnotes/ui-services'

export class DevModeHook {
  load(_application: WebApplicationInterface) {
    InternalFeatureService.get().enableFeature(InternalFeature.Vaults)
  }
}
