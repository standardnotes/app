import { SCREEN_AUTHENTICATE } from '@Root/Screens/screens'
import {
  Challenge,
  ChallengePrompt,
  ChallengeReason,
  ChallengeValidation,
  DeinitMode,
  DeinitSource,
  Environment,
  IconsController,
  ItemGroupController,
  platformFromString,
  SNApplication,
  SNComponentManager,
} from '@standardnotes/snjs'
import { Platform } from 'react-native'

import { version } from '../../package.json'
import { MobileAlertService } from './AlertService'
import { ApplicationState, UnlockTiming } from './ApplicationState'
import { BackupsService } from './BackupsService'
import { ComponentManager } from './ComponentManager'
import { FilesService } from './FilesService'
import { InstallationService } from './InstallationService'
import { MobileDeviceInterface } from './Interface'
import { push } from './NavigationService'
import { PreferencesManager } from './PreferencesManager'
import { SNReactNativeCrypto } from './ReactNativeCrypto'
import { ReviewService } from './ReviewService'
import { StatusManager } from './StatusManager'
import { IsDev } from './Utils'

type MobileServices = {
  applicationState: ApplicationState
  reviewService: ReviewService
  backupsService: BackupsService
  installationService: InstallationService
  prefsService: PreferencesManager
  statusManager: StatusManager
  filesService: FilesService
}

export class MobileApplication extends SNApplication {
  private MobileServices!: MobileServices
  public editorGroup: ItemGroupController
  public iconsController: IconsController
  private startedDeinit = false

  // UI remounts when Uuid changes
  public Uuid: string

  static previouslyLaunched = false

  constructor(deviceInterface: MobileDeviceInterface, identifier: string) {
    super({
      environment: Environment.Mobile,
      platform: platformFromString(Platform.OS),
      deviceInterface: deviceInterface,
      crypto: new SNReactNativeCrypto(),
      alertService: new MobileAlertService(),
      identifier,
      swapClasses: [
        {
          swap: SNComponentManager,
          with: ComponentManager,
        },
      ],
      defaultHost: IsDev ? 'https://api-dev.standardnotes.com' : 'https://api.standardnotes.com',
      appVersion: version,
      webSocketUrl: IsDev ? 'wss://sockets-dev.standardnotes.com' : 'wss://sockets.standardnotes.com',
    })

    this.Uuid = Math.random().toString()
    this.editorGroup = new ItemGroupController(this)
    this.iconsController = new IconsController()

    void this.mobileComponentManager.initialize(this.protocolService)
  }

  get mobileComponentManager(): ComponentManager {
    return this.componentManager as ComponentManager
  }

  static getPreviouslyLaunched() {
    return this.previouslyLaunched
  }

  static setPreviouslyLaunched() {
    this.previouslyLaunched = true
  }

  public hasStartedDeinit() {
    return this.startedDeinit
  }

  override deinit(mode: DeinitMode, source: DeinitSource): void {
    this.startedDeinit = true

    for (const service of Object.values(this.MobileServices)) {
      if (service.deinit) {
        service.deinit()
      }

      if ('application' in service) {
        const typedService = service as { application?: MobileApplication }
        typedService.application = undefined
      }
    }

    this.MobileServices = {} as MobileServices
    this.editorGroup.deinit()
    super.deinit(mode, source)
  }

  override getLaunchChallenge() {
    const challenge = super.getLaunchChallenge()

    if (!challenge) {
      return undefined
    }

    const previouslyLaunched = MobileApplication.getPreviouslyLaunched()
    const biometricsTiming = this.getAppState().biometricsTiming

    if (previouslyLaunched && biometricsTiming === UnlockTiming.OnQuit) {
      const filteredPrompts = challenge.prompts.filter(
        (prompt: ChallengePrompt) => prompt.validation !== ChallengeValidation.Biometric,
      )

      return new Challenge(filteredPrompts, ChallengeReason.ApplicationUnlock, false)
    }

    return challenge
  }

  promptForChallenge(challenge: Challenge) {
    push(SCREEN_AUTHENTICATE, { challenge, title: challenge.modalTitle })
  }

  setMobileServices(services: MobileServices) {
    this.MobileServices = services
  }

  public getAppState() {
    return this.MobileServices.applicationState
  }

  public getBackupsService() {
    return this.MobileServices.backupsService
  }

  public getLocalPreferences() {
    return this.MobileServices.prefsService
  }

  public getStatusManager() {
    return this.MobileServices.statusManager
  }

  public getFilesService() {
    return this.MobileServices.filesService
  }
}
