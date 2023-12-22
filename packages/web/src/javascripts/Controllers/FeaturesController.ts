import { FeaturesClientInterface, InternalEventHandlerInterface } from '@standardnotes/services'
import { FeatureName } from './FeatureName'
import { PremiumFeatureModalType } from '@/Components/PremiumFeaturesModal/PremiumFeatureModalType'
import { destroyAllObjectProperties } from '@/Utils'
import {
  ApplicationEvent,
  NativeFeatureIdentifier,
  FeatureStatus,
  InternalEventBusInterface,
  InternalEventInterface,
  RoleName,
} from '@standardnotes/snjs'
import { action, makeObservable, observable, runInAction, when } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { CrossControllerEvent } from './CrossControllerEvent'
import { featureTrunkVaultsEnabled } from '@/FeatureTrunk'

export class FeaturesController extends AbstractViewController implements InternalEventHandlerInterface {
  hasFolders: boolean
  hasSmartViews: boolean
  entitledToFiles: boolean
  premiumAlertFeatureName: string | undefined
  premiumAlertType: PremiumFeatureModalType | undefined = undefined

  override deinit() {
    super.deinit()
    ;(this.showPremiumAlert as unknown) = undefined
    ;(this.closePremiumAlert as unknown) = undefined
    ;(this.hasFolders as unknown) = undefined
    ;(this.hasSmartViews as unknown) = undefined
    ;(this.entitledToFiles as unknown) = undefined
    ;(this.premiumAlertFeatureName as unknown) = undefined
    ;(this.premiumAlertType as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(
    private features: FeaturesClientInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    this.hasFolders = this.isEntitledToFolders()
    this.hasSmartViews = this.isEntitledToSmartViews()
    this.entitledToFiles = this.isEntitledToFiles()
    this.premiumAlertFeatureName = undefined

    makeObservable(this, {
      hasFolders: observable,
      hasSmartViews: observable,
      entitledToFiles: observable,
      premiumAlertType: observable,
      premiumAlertFeatureName: observable,
      showPremiumAlert: action,
      closePremiumAlert: action,
      showPurchaseSuccessAlert: action,
    })

    eventBus.addEventHandler(this, CrossControllerEvent.DisplayPremiumModal)
    eventBus.addEventHandler(this, ApplicationEvent.DidPurchaseSubscription)
    eventBus.addEventHandler(this, ApplicationEvent.FeaturesAvailabilityChanged)
    eventBus.addEventHandler(this, ApplicationEvent.Launched)
    eventBus.addEventHandler(this, ApplicationEvent.LocalDataLoaded)
    eventBus.addEventHandler(this, ApplicationEvent.UserRolesChanged)

    this.showPremiumAlert = this.showPremiumAlert.bind(this)
    this.closePremiumAlert = this.closePremiumAlert.bind(this)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case ApplicationEvent.DidPurchaseSubscription:
        this.showPurchaseSuccessAlert()
        break
      case ApplicationEvent.FeaturesAvailabilityChanged:
      case ApplicationEvent.Launched:
      case ApplicationEvent.LocalDataLoaded:
      case ApplicationEvent.UserRolesChanged:
        runInAction(() => {
          this.hasFolders = this.isEntitledToFolders()
          this.hasSmartViews = this.isEntitledToSmartViews()
          this.entitledToFiles = this.isEntitledToFiles()
        })
        break
      case CrossControllerEvent.DisplayPremiumModal:
        {
          const payload = event.payload as { featureName: string }
          void this.showPremiumAlert(payload.featureName)
        }
        break
    }
  }

  public async showPremiumAlert(featureName?: FeatureName | string): Promise<void> {
    this.premiumAlertFeatureName = featureName
    this.premiumAlertType = PremiumFeatureModalType.UpgradePrompt

    return when(() => this.premiumAlertType === undefined)
  }

  showPurchaseSuccessAlert = () => {
    this.premiumAlertType = PremiumFeatureModalType.UpgradeSuccess
  }

  showSuperDemoModal = () => {
    this.premiumAlertType = PremiumFeatureModalType.SuperDemo
  }

  public closePremiumAlert() {
    this.premiumAlertType = undefined
  }

  private isEntitledToFiles(): boolean {
    const status = this.features.getFeatureStatus(
      NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.Files).getValue(),
    )

    return status === FeatureStatus.Entitled
  }

  private isEntitledToFolders(): boolean {
    const status = this.features.getFeatureStatus(
      NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.TagNesting).getValue(),
    )

    return status === FeatureStatus.Entitled
  }

  private isEntitledToSmartViews(): boolean {
    const status = this.features.getFeatureStatus(
      NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.SmartFilters).getValue(),
    )

    return status === FeatureStatus.Entitled
  }

  isVaultsEnabled(): boolean {
    const enabled = this.features.isExperimentalFeatureEnabled(NativeFeatureIdentifier.TYPES.Vaults)
    return (
      featureTrunkVaultsEnabled() ||
      enabled ||
      this.features.hasRole(RoleName.create(RoleName.NAMES.InternalTeamUser).getValue())
    )
  }

  isEntitledToSharedVaults(): boolean {
    const status = this.features.getFeatureStatus(
      NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.SharedVaults).getValue(),
    )
    const isEntitledToFeature = status === FeatureStatus.Entitled

    return featureTrunkVaultsEnabled() || isEntitledToFeature
  }
}
