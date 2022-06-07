import { InternalEventBus } from '@standardnotes/services'
import { ApplicationDescriptor, DeviceInterface, SNApplicationGroup } from '@standardnotes/snjs'
import { MobileApplication } from './Application'
import { ApplicationState } from './ApplicationState'
import { BackupsService } from './BackupsService'
import { FilesService } from './FilesService'
import { InstallationService } from './InstallationService'
import { MobileDeviceInterface } from './Interface'
import { PreferencesManager } from './PreferencesManager'
import { ReviewService } from './ReviewService'
import { StatusManager } from './StatusManager'

export class ApplicationGroup extends SNApplicationGroup {
  constructor() {
    super(new MobileDeviceInterface())
  }

  override async initialize(_callback?: any): Promise<void> {
    await super.initialize({
      applicationCreator: this.createApplication,
    })
  }

  private createApplication = async (descriptor: ApplicationDescriptor, deviceInterface: DeviceInterface) => {
    const application = new MobileApplication(deviceInterface as MobileDeviceInterface, descriptor.identifier)
    const internalEventBus = new InternalEventBus()
    const applicationState = new ApplicationState(application)
    const reviewService = new ReviewService(application, internalEventBus)
    const backupsService = new BackupsService(application, internalEventBus)
    const prefsService = new PreferencesManager(application, internalEventBus)
    const installationService = new InstallationService(application, internalEventBus)
    const statusManager = new StatusManager(application, internalEventBus)
    const filesService = new FilesService(application, internalEventBus)
    application.setMobileServices({
      applicationState,
      reviewService,
      backupsService,
      prefsService,
      installationService,
      statusManager,
      filesService,
    })
    return application
  }
}
