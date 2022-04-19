import { isDev } from '@/Utils'
import { ApplicationEvent, FeatureIdentifier, FeatureStatus } from '@standardnotes/snjs'
import { action, computed, makeObservable, observable, runInAction, when } from 'mobx'
import { WebApplication } from '../Application'

export const TAG_FOLDERS_FEATURE_NAME = 'Tag folders'
export const TAG_FOLDERS_FEATURE_TOOLTIP = 'A Plus or Pro plan is required to enable Tag folders.'

export const SMART_TAGS_FEATURE_NAME = 'Smart Tags'

/**
 * Holds state for premium/non premium features for the current user features,
 * and eventually for in-development features (feature flags).
 */
export class FeaturesState {
  readonly enableUnfinishedFeatures: boolean = window?.enabledUnfinishedFeatures

  _hasFolders = false
  _hasSmartViews = false
  _hasFilesBeta = false
  _premiumAlertFeatureName: string | undefined

  private unsub: () => void

  constructor(private application: WebApplication) {
    this._hasFolders = this.hasNativeFolders()
    this._hasSmartViews = this.hasNativeSmartViews()
    this._hasFilesBeta = this.isEntitledToFilesBeta()
    this._premiumAlertFeatureName = undefined

    makeObservable(this, {
      _hasFolders: observable,
      _hasSmartViews: observable,
      hasFolders: computed,
      _premiumAlertFeatureName: observable,
      showPremiumAlert: action,
      closePremiumAlert: action,
    })

    this.showPremiumAlert = this.showPremiumAlert.bind(this)
    this.closePremiumAlert = this.closePremiumAlert.bind(this)

    this.unsub = this.application.addEventObserver(async (eventName) => {
      switch (eventName) {
        case ApplicationEvent.FeaturesUpdated:
        case ApplicationEvent.Launched:
          runInAction(() => {
            this._hasFolders = this.hasNativeFolders()
            this._hasSmartViews = this.hasNativeSmartViews()
            this._hasFilesBeta = this.isEntitledToFilesBeta()
          })
          break
        default:
          break
      }
    })
  }

  public deinit() {
    this.unsub()
  }

  public get hasFolders(): boolean {
    return this._hasFolders
  }

  public get hasSmartViews(): boolean {
    return this._hasSmartViews
  }

  public get isFilesEnabled(): boolean {
    return this._hasFilesBeta || window.enabledUnfinishedFeatures || isDev
  }

  public get isEntitledToFiles(): boolean {
    return this._hasFilesBeta
  }

  public async showPremiumAlert(featureName: string): Promise<void> {
    this._premiumAlertFeatureName = featureName
    return when(() => this._premiumAlertFeatureName === undefined)
  }

  public async closePremiumAlert(): Promise<void> {
    this._premiumAlertFeatureName = undefined
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
