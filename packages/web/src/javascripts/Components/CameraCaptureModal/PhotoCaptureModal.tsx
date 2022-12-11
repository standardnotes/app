import { FilesController } from '@/Controllers/FilesController'
import { PhotoRecorder } from '@/Controllers/Moments/PhotoRecorder'
import { classNames } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Button from '../Button/Button'
import Dropdown from '../Dropdown/Dropdown'
import Icon from '../Icon/Icon'
import DecoratedInput from '../Input/DecoratedInput'
import ModalDialog from '../Shared/ModalDialog'
import ModalDialogButtons from '../Shared/ModalDialogButtons'
import ModalDialogDescription from '../Shared/ModalDialogDescription'
import ModalDialogLabel from '../Shared/ModalDialogLabel'

type Props = {
  filesController: FilesController
  close: () => void
}

const PhotoCaptureModal = ({ filesController, close }: Props) => {
  const [fileName, setFileName] = useState('')
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

  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={close}>Take a photo</ModalDialogLabel>
      <ModalDialogDescription>
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
                id={'photo-capture-device-dropdown'}
                label={'Photo Capture Device'}
                items={devicesAsDropdownItems}
                value={recorder.selectedDevice.deviceId}
                onChange={(value: string) => {
                  void recorder.setDevice(value)
                }}
                className={{
                  wrapper: 'mt-1',
                  popover: 'z-modal',
                }}
              />
            </label>
          </div>
        )}
      </ModalDialogDescription>
      <ModalDialogButtons>
        {!capturedPhoto && (
          <Button
            primary
            colorStyle="danger"
            className="flex items-center gap-2"
            onClick={() => {
              void takePhoto()
            }}
          >
            <Icon type="camera" />
            Take photo
          </Button>
        )}
        {capturedPhoto && (
          <div className="flex items-center gap-2">
            <Button
              className="flex items-center gap-2"
              onClick={() => {
                setCapturedPhoto(undefined)
                setRecorder(new PhotoRecorder())
              }}
            >
              Retry
            </Button>
            <Button primary className="flex items-center gap-2" onClick={savePhoto}>
              <Icon type="upload" />
              Upload
            </Button>
          </div>
        )}
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default observer(PhotoCaptureModal)
