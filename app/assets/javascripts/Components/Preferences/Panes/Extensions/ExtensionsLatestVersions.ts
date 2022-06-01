import { WebApplication } from '@/Application/Application'
import { ClientDisplayableError, FeatureDescription } from '@standardnotes/snjs'
import { makeAutoObservable, observable } from 'mobx'
import { AnyExtension } from './AnyExtension'

export class ExtensionsLatestVersions {
  static async load(application: WebApplication): Promise<ExtensionsLatestVersions | undefined> {
    const response = await application.getAvailableSubscriptions()

    if (response instanceof ClientDisplayableError) {
      return undefined
    }

    const versionMap: Map<string, string> = new Map()
    collectFeatures(response.PLUS_PLAN?.features as FeatureDescription[], versionMap)
    collectFeatures(response.PRO_PLAN?.features as FeatureDescription[], versionMap)

    return new ExtensionsLatestVersions(versionMap)
  }

  constructor(private readonly latestVersionsMap: Map<string, string>) {
    makeAutoObservable<ExtensionsLatestVersions, 'latestVersionsMap'>(this, {
      latestVersionsMap: observable.ref,
    })
  }

  getVersion(extension: AnyExtension): string | undefined {
    return this.latestVersionsMap.get(extension.package_info.identifier)
  }
}

function collectFeatures(features: FeatureDescription[] | undefined, versionMap: Map<string, string>) {
  if (features == undefined) {
    return
  }
  for (const feature of features) {
    versionMap.set(feature.identifier, feature.version as string)
  }
}
