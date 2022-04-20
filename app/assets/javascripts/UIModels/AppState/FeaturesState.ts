import { WebApplication } from '@/UIModels/Application'
import { isDev } from '@/Utils'
import { ApplicationEvent, FeatureIdentifier, FeatureStatus } from '@standardnotes/snjs'
import { action, computed, makeObservable, observable, runInAction, when } from 'mobx'

export class FeaturesState {
  hasFolders: boolean
  hasSmartViews: boolean
  hasFilesBeta: boolean
  premiumAlertFeatureName: string | undefined

  constructor(private application: WebApplication, appObservers: (() => void)[]) {
    this.hasFolders = this.hasNativeFolders()
    this.hasSmartViews = this.hasNativeSmartViews()
    this.hasFilesBeta = this.isEntitledToFilesBeta()
    this.premiumAlertFeatureName = undefined

    makeObservable(this, {
      hasFolders: observable,
      hasSmartViews: observable,

      hasFilesBeta: observable,
      isFilesEnabled: computed,
      isEntitledToFiles: computed,

      premiumAlertFeatureName: observable,
      showPremiumAlert: action,
      closePremiumAlert: action,
    })

    this.showPremiumAlert = this.showPremiumAlert.bind(this)
    this.closePremiumAlert = this.closePremiumAlert.bind(this)

    appObservers.push(
      application.addEventObserver(async (event) => {
        switch (event) {
          case ApplicationEvent.FeaturesUpdated:
          case ApplicationEvent.Launched:
            runInAction(() => {
              this.hasFolders = this.hasNativeFolders()
              this.hasSmartViews = this.hasNativeSmartViews()
              this.hasFilesBeta = this.isEntitledToFilesBeta()
            })
        }
      }),
    )
  }

  public async showPremiumAlert(featureName: string): Promise<void> {
    this.premiumAlertFeatureName = featureName
    return when(() => this.premiumAlertFeatureName === undefined)
  }

  public async closePremiumAlert(): Promise<void> {
    this.premiumAlertFeatureName = undefined
  }

  get isFilesEnabled(): boolean {
    return this.hasFilesBeta || window.enabledUnfinishedFeatures || isDev
  }

  get isEntitledToFiles(): boolean {
    return this.hasFilesBeta
  }

  private hasNativeFolders(): boolean {
    const status = this.application.features.getFeatureStatus(FeatureIdentifier.TagNesting)

    return status === FeatureStatus.Entitled
  }

  private hasNativeSmartViews(): boolean {
    const status = this.application.features.getFeatureStatus(FeatureIdentifier.SmartFilters)

    return status === FeatureStatus.Entitled
  }

  private isEntitledToFilesBeta(): boolean {
    if (window.enabledUnfinishedFeatures) {
      return true
    }

    const status = this.application.features.getFeatureStatus(FeatureIdentifier.FilesBeta)
    return status === FeatureStatus.Entitled
  }
}
