import { WebApplication } from "@/ui_models/application";
import { FeatureDescription } from "@standardnotes/features";
import { SNComponent } from "@standardnotes/snjs/dist/@types";
import { makeAutoObservable, observable } from "mobx";

export class ExtensionsLatestVersions {
  static async load(application: WebApplication): Promise<ExtensionsLatestVersions> {
    const map = await application.getAvailableSubscriptions()
      .then(subscriptions => {
        const versionMap: Map<string, string> = new Map();
        collectFeatures(subscriptions?.CORE_PLAN?.features as FeatureDescription[], versionMap);
        collectFeatures(subscriptions?.PLUS_PLAN?.features as FeatureDescription[], versionMap);
        collectFeatures(subscriptions?.PRO_PLAN?.features as FeatureDescription[], versionMap);
        return versionMap;
      });
    return new ExtensionsLatestVersions(map);
  }

  constructor(private readonly latestVersionsMap: Map<string, string>) {
    makeAutoObservable<ExtensionsLatestVersions, 'latestVersionsMap'>(
      this, { latestVersionsMap: observable.ref });
  }

  getVersion(extension: SNComponent): string | undefined {
    return this.latestVersionsMap.get(extension.package_info.identifier);
  }

}

function collectFeatures(features: FeatureDescription[] | undefined, versionMap: Map<string, string>) {
  if (features == undefined) return;
  for (const feature of features) {
    versionMap.set(feature.identifier, feature.version);
  }
}
