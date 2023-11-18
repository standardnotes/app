import { GetFeatures } from '@standardnotes/snjs'
import { makeAutoObservable, observable } from 'mobx'
import { AnyPackageType } from './AnyPackageType'

export class PackageProvider {
  static async load(): Promise<PackageProvider | undefined> {
    const versionMap: Map<string, string> = new Map()

    GetFeatures().forEach((feature) => {
      versionMap.set(feature.identifier, 'Latest')
    })

    return new PackageProvider(versionMap)
  }

  constructor(private readonly latestVersionsMap: Map<string, string>) {
    makeAutoObservable<PackageProvider, 'latestVersionsMap'>(this, {
      latestVersionsMap: observable.ref,
    })
  }

  getVersion(extension: AnyPackageType): string | undefined {
    return this.latestVersionsMap.get(extension.package_info.identifier)
  }
}
