import { WebApplication } from '@/UIModels/Application'
import { destroyAllObjectProperties } from '@/Utils'
import { ApplicationEvent, DeinitSource, FeatureIdentifier, FeatureStatus } from '@standardnotes/snjs'
import { action, makeObservable, observable, runInAction, when } from 'mobx'
import { AbstractState } from './AbstractState'

export class FeaturesState extends AbstractState {
  hasFolders: boolean
  hasSmartViews: boolean
  hasFiles: boolean
  premiumAlertFeatureName: string | undefined

  override deinit(source: DeinitSource) {
    super.deinit(source)
    ;(this.showPremiumAlert as unknown) = undefined
    ;(this.closePremiumAlert as unknown) = undefined
    ;(this.hasFolders as unknown) = undefined
    ;(this.hasSmartViews as unknown) = undefined
    ;(this.hasFiles as unknown) = undefined
    ;(this.premiumAlertFeatureName as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(application: WebApplication, appObservers: (() => void)[]) {
    super(application)

    this.hasFolders = this.isEntitledToFolders()
    this.hasSmartViews = this.isEntitledToSmartViews()
    this.hasFiles = this.isEntitledToFiles()
    this.premiumAlertFeatureName = undefined

    makeObservable(this, {
      hasFolders: observable,
      hasSmartViews: observable,
      hasFiles: observable,

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
              this.hasFolders = this.isEntitledToFolders()
              this.hasSmartViews = this.isEntitledToSmartViews()
              this.hasFiles = this.isEntitledToFiles()
            })
        }
      }),
    )
  }

  public async showPremiumAlert(featureName: string): Promise<void> {
    this.premiumAlertFeatureName = featureName
    return when(() => this.premiumAlertFeatureName === undefined)
  }

  public closePremiumAlert() {
    this.premiumAlertFeatureName = undefined
  }

  private isEntitledToFiles(): boolean {
    const status = this.application.features.getFeatureStatus(FeatureIdentifier.Files)

    return status === FeatureStatus.Entitled
  }

  private isEntitledToFolders(): boolean {
    const status = this.application.features.getFeatureStatus(FeatureIdentifier.TagNesting)

    return status === FeatureStatus.Entitled
  }

  private isEntitledToSmartViews(): boolean {
    const status = this.application.features.getFeatureStatus(FeatureIdentifier.SmartFilters)

    return status === FeatureStatus.Entitled
  }
}
