import { FilesController } from '@/Controllers/FilesController'
import { PhotoRecorder } from '@/Controllers/Moments/PhotoRecorder'
import { formatDateAndTimeForNote } from '@/Utils/DateUtils'
import { classNames } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Dropdown from '../Dropdown/Dropdown'
import Icon from '../Icon/Icon'
import DecoratedInput from '../Input/DecoratedInput'
import Modal from '../Modal/Modal'

type Props = {
  filesController: FilesController
  close: () => void
}

const PhotoCaptureModal = ({ filesController, close }: Props) => {
  const [fileName, setFileName] = useState(formatDateAndTimeForNote(new Date()))
  const [recorder, setRecorder] = useState<PhotoRecorder | undefined>(() => new PhotoRecorder())
  const [isRecorderReady, setIsRecorderReady] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<File>()

  const fileNameInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!recorder) {
      return
    }

    setIsRecorderReady(false)

    const init = async () => {
      await recorder.initialize()

      if (previewRef.current) {
        recorder.video.style.position = ''
        recorder.video.style.display = ''
        recorder.video.style.height = '100%'
        previewRef.current.append(recorder.video)
      }

      setIsRecorderReady(true)
    }

    void init()

    return () => {
      if (recorder.video) {
        recorder.finish()
      }
    }
  }, [recorder])

  const takePhoto = useCallback(async () => {
    if (!recorder) {
      return
    }

    const file = await recorder.takePhoto(fileName)
    setCapturedPhoto(file)
    setRecorder(undefined)
  }, [fileName, recorder])

  const devicesAsDropdownItems = useMemo(() => {
    return recorder?.devices
      ? recorder.devices.map((device) => ({
          label: device.label || `Camera (${device.deviceId.slice(0, 10)})`,
          value: device.deviceId,
        }))
      : []
  }, [recorder?.devices])

  const savePhoto = useCallback(() => {
    if (!fileName) {
      fileNameInputRef.current?.focus()
      return
    }
    if (!capturedPhoto) {
      return
    }
    void filesController.uploadNewFile(capturedPhoto)
    close()
  }, [capturedPhoto, close, fileName, filesController])

  const retryPhoto = () => {
    setCapturedPhoto(undefined)
    setRecorder(new PhotoRecorder())
  }
  return (
    <Modal
      title="Take a photo"
      close={close}
      actions={[
        {
          label: 'Capture',
          onClick: takePhoto,
          type: 'primary',
          mobileSlot: 'right',
          hidden: !!capturedPhoto,
        },
        {
          label: 'Upload',
          onClick: savePhoto,
          type: 'primary',
          mobileSlot: 'right',
          hidden: !capturedPhoto,
        },
        {
          label: 'Cancel',
          onClick: close,
          type: 'cancel',
          mobileSlot: 'left',
        },
        {
          label: 'Retry',
          onClick: retryPhoto,
          type: 'secondary',
        },
      ]}
    >
      <div className="px-4 py-4">
        <div className="mb-4 flex flex-col">
          <label className="text-sm font-medium text-neutral">
            File name:
            <DecoratedInput
              className={{
                container: 'mt-1',
              }}
              value={fileName}
              onChange={(fileName) => setFileName(fileName)}
              ref={fileNameInputRef}
            />
          </label>
        </div>
        <div className="mt-2">
          <div className="text-sm font-medium text-neutral">Preview:</div>
          {!isRecorderReady && (
            <div className="mt-1 w-full">
              <div className="flex h-64 w-full items-center justify-center gap-2 rounded-md bg-contrast text-base">
                <Icon type="camera" className="text-neutral-300" />
                Initializing...
              </div>
            </div>
          )}
          <div className={classNames('mt-1 w-full', capturedPhoto && 'hidden')} ref={previewRef}></div>
          {capturedPhoto && (
            <div className="mt-1 w-full">
              <img src={URL.createObjectURL(capturedPhoto)} alt="Captured photo" />
            </div>
          )}
        </div>
        {recorder && devicesAsDropdownItems.length > 1 && !capturedPhoto && (
          <div className="mt-4">
            <label className="text-sm font-medium text-neutral">
              Device:
              <Dropdown
                label={'Photo Capture Device'}
                items={devicesAsDropdownItems}
                value={recorder.selectedDevice.deviceId}
                onChange={(value: string) => {
                  void recorder.setDevice(value)
                }}
                classNameOverride={{
                  wrapper: 'mt-1',
                }}
              />
            </label>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default observer(PhotoCaptureModal)
