import { ApplicationEvent, InternalEventBus, StorageKey } from '@standardnotes/services'
import { isDev } from '@/Utils'
import { FileItem, sleep } from '@standardnotes/snjs'
import { FilesController } from '../FilesController'
import { preparePhotoOperation, takePhoto, stopCameraStream } from './prepareCameraElements'
import { action, makeObservable, observable } from 'mobx'
import { AbstractViewController } from '@/Controllers/Abstract/AbstractViewController'
import { WebApplication } from '@/Application/Application'

const EVERY_HALF_HOUR = 1000 * 60 * 30
const EVERY_TEN_SECONDS = 1000 * 10
const DEBUG_MODE = isDev && false

export class TimelapseService extends AbstractViewController {
  isEnabled = false
  isEntitledToTimelapse = false
  private intervalReference: ReturnType<typeof setInterval> | undefined

  constructor(application: WebApplication, private filesController: FilesController, eventBus: InternalEventBus) {
    super(application, eventBus)

    this.disposers.push(
      application.addEventObserver(async () => {
        this.isEnabled = (this.application.getValue(StorageKey.TimelapseEnabled) as boolean) ?? false
        if (this.isEnabled) {
          void this.beginTakingPhotos()
        }
      }, ApplicationEvent.Launched),
    )

    makeObservable(this, {
      isEnabled: observable,
      isEntitledToTimelapse: observable,

      enableTimelapse: action,
      disableTimelapse: action,
    })
  }

  override deinit() {
    super.deinit()
    ;(this.application as unknown) = undefined
    ;(this.filesController as unknown) = undefined
  }

  public enableTimelapse = (): void => {
    this.application.setValue(StorageKey.TimelapseEnabled, true)

    this.isEnabled = true

    void this.beginTakingPhotos()
  }

  public disableTimelapse = (): void => {
    this.application.setValue(StorageKey.TimelapseEnabled, false)

    this.isEnabled = false

    clearInterval(this.intervalReference)
  }

  private beginTakingPhotos() {
    void this.takePhoto()

    this.intervalReference = setInterval(
      () => {
        void this.takePhoto()
      },
      DEBUG_MODE ? EVERY_TEN_SECONDS : EVERY_HALF_HOUR,
    )
  }

  public async takePhoto(): Promise<FileItem[] | undefined> {
    const { canvas, video, stream, width, height } = await preparePhotoOperation()

    const filename = `📸 Moments-${new Date().toLocaleDateString()}.png`

    let file = await takePhoto(filename, canvas, video, width, height)
    if (!file) {
      await sleep(1000)
      file = await takePhoto(filename, canvas, video, width, height)
      if (!file) {
        return undefined
      }
    }
    const uploadedFile = await this.filesController.uploadNewFile(file)

    stopCameraStream(canvas, video, stream)

    return uploadedFile
  }
}
