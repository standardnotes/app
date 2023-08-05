import { addToast, dismissToast, ToastType } from '@standardnotes/toast'
import {
  ApplicationEvent,
  DesktopDeviceInterface,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  ItemManagerInterface,
  PreferenceServiceInterface,
  ProtectionEvent,
  ProtectionsClientInterface,
  StorageKey,
  StorageServiceInterface,
} from '@standardnotes/services'
import { isDev } from '@/Utils'
import { FileItem, PrefKey, sleep, SNTag } from '@standardnotes/snjs'
import { FilesController } from '../FilesController'
import { action, makeObservable, observable } from 'mobx'
import { AbstractViewController } from '@/Controllers/Abstract/AbstractViewController'
import { dateToStringStyle1 } from '@/Utils/DateUtils'
import { PhotoRecorder } from './PhotoRecorder'
import { LinkingController } from '../LinkingController'
import { IsMobileDevice } from '@standardnotes/ui-services'

const EVERY_HOUR = 1000 * 60 * 60
const EVERY_TEN_SECONDS = 1000 * 10
const DEBUG_MODE = isDev && false

const DELAY_AFTER_STARTING_CAMERA_TO_ALLOW_MOBILE_AUTOFOCUS = 2000

export class MomentsService extends AbstractViewController implements InternalEventHandlerInterface {
  isEnabled = false
  private intervalReference: ReturnType<typeof setInterval> | undefined

  constructor(
    private filesController: FilesController,
    private linkingController: LinkingController,
    private storage: StorageServiceInterface,
    private preferences: PreferenceServiceInterface,
    private items: ItemManagerInterface,
    private protections: ProtectionsClientInterface,
    private desktopDevice: DesktopDeviceInterface | undefined,
    private _isMobileDevice: IsMobileDevice,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    makeObservable(this, {
      isEnabled: observable,

      enableMoments: action,
      disableMoments: action,
    })

    eventBus.addEventHandler(this, ApplicationEvent.LocalDataLoaded)
    eventBus.addEventHandler(this, ProtectionEvent.BiometricsSoftLockEngaged)
    eventBus.addEventHandler(this, ProtectionEvent.BiometricsSoftLockDisengaged)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case ApplicationEvent.LocalDataLoaded: {
        this.isEnabled = (this.storage.getValue(StorageKey.MomentsEnabled) as boolean) ?? false
        if (this.isEnabled) {
          void this.beginTakingPhotos()
        }
        break
      }

      case ProtectionEvent.BiometricsSoftLockEngaged: {
        this.pauseMoments()
        break
      }

      case ProtectionEvent.BiometricsSoftLockDisengaged: {
        this.resumeMoments()
        break
      }
    }
  }

  override deinit() {
    super.deinit()
    ;(this.filesController as unknown) = undefined
  }

  public enableMoments = (): void => {
    this.storage.setValue(StorageKey.MomentsEnabled, true)

    this.isEnabled = true

    void this.beginTakingPhotos()
  }

  public disableMoments = (): void => {
    this.storage.setValue(StorageKey.MomentsEnabled, false)

    this.isEnabled = false

    clearInterval(this.intervalReference)
  }

  private pauseMoments(): void {
    clearInterval(this.intervalReference)
  }

  private resumeMoments(): void {
    if (!this.isEnabled) {
      return
    }

    void this.beginTakingPhotos()
  }

  private beginTakingPhotos() {
    if (this.intervalReference) {
      clearInterval(this.intervalReference)
    }

    void this.takePhoto()

    this.intervalReference = setInterval(
      () => {
        void this.takePhoto()
      },
      DEBUG_MODE ? EVERY_TEN_SECONDS : EVERY_HOUR,
    )
  }

  private getDefaultTag(): SNTag | undefined {
    const defaultTagId = this.preferences.getValue(PrefKey.MomentsDefaultTagUuid)

    if (defaultTagId) {
      return this.items.findItem(defaultTagId)
    }
  }

  public takePhoto = async (): Promise<FileItem | undefined> => {
    const isAppLocked = await this.protections.isLocked()

    if (isAppLocked) {
      return
    }

    const isAppInForeground = document.visibilityState === 'visible'

    let toastId: string | undefined

    if (isAppInForeground) {
      toastId = addToast({
        type: ToastType.Regular,
        message: 'Capturing Moment...',
        pauseOnWindowBlur: false,
      })
    }

    if (this.desktopDevice) {
      const granted = await this.desktopDevice.askForMediaAccess('camera')
      if (!granted) {
        if (toastId) {
          dismissToast(toastId)
        }
        addToast({
          type: ToastType.Error,
          message: 'Please enable Camera permissions for Standard Notes to enable Moments.',
          duration: 3000,
        })

        return
      }
    }

    const filename = `Moment ${dateToStringStyle1(new Date())}.png`
    const camera = new PhotoRecorder()
    await camera.initialize()

    if (this._isMobileDevice.execute().getValue()) {
      await sleep(DELAY_AFTER_STARTING_CAMERA_TO_ALLOW_MOBILE_AUTOFOCUS)
    }

    let file = await camera.takePhoto(filename)
    if (!file) {
      await sleep(1000)
      file = await camera.takePhoto(filename)
      if (!file) {
        return undefined
      }
    }

    if (toastId) {
      dismissToast(toastId)
    }

    const uploadedFile = await this.filesController.uploadNewFile(file)

    if (uploadedFile) {
      if (isAppInForeground) {
        void this.linkingController.linkItemToSelectedItem(uploadedFile)
      }

      const defaultTag = this.getDefaultTag()
      if (defaultTag) {
        void this.linkingController.linkItems(uploadedFile, defaultTag)
      }
    }

    camera.finish()

    return uploadedFile
  }
}
