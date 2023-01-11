import { FilesController } from '@/Controllers/FilesController'
import { VideoRecorder } from '@/Controllers/Moments/VideoRecorder'
import { formatDateAndTimeForNote } from '@/Utils/DateUtils'
import { classNames } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Button from '../Button/Button'
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

const VideoCaptureModal = ({ filesController, close }: Props) => {
  const [fileName, setFileName] = useState(formatDateAndTimeForNote(new Date()))
  const [recorder, setRecorder] = useState(() => new VideoRecorder(fileName))
  const [isRecorderReady, setIsRecorderReady] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [capturedVideo, setCapturedVideo] = useState<File>()

  const fileNameInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
        void recorder.stop()
      }
    }
  }, [recorder])

  const startRecording = useCallback(async () => {
    await recorder.startRecording()
    setIsRecording(true)
  }, [recorder])

  const saveVideo = useCallback(() => {
    if (!fileName) {
      fileNameInputRef.current?.focus()
      return
    }
    if (!capturedVideo) {
      return
    }
    const namedFile = new File([capturedVideo], fileName, {
      type: capturedVideo.type,
    })
    void filesController.uploadNewFile(namedFile)
    close()
  }, [capturedVideo, close, fileName, filesController])

  const capturedVideoObjectURL = useMemo(() => {
    if (!capturedVideo) {
      return
    }
    return URL.createObjectURL(capturedVideo)
  }, [capturedVideo])

  return (
    <ModalDialog isOpen={true} close={close}>
      <ModalDialogLabel closeDialog={close}>Record a video</ModalDialogLabel>
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
          <div className={classNames('mt-1 w-full', capturedVideo && 'hidden')} ref={previewRef}></div>
          {capturedVideo && (
            <div className="mt-1 w-full">
              <video src={capturedVideoObjectURL} controls />
            </div>
          )}
        </div>
      </ModalDialogDescription>
      <ModalDialogButtons>
        {!capturedVideo && !isRecording && (
          <Button
            primary
            className="flex items-center gap-2"
            onClick={() => {
              void startRecording()
            }}
          >
            <Icon type="camera" />
            Start recording
          </Button>
        )}
        {!capturedVideo && isRecording && (
          <Button
            primary
            colorStyle="danger"
            className="flex items-center gap-2"
            onClick={async () => {
              const capturedVideo = await recorder.stop()
              setIsRecording(false)
              setCapturedVideo(capturedVideo)
            }}
          >
            <Icon type="camera" />
            Stop recording
          </Button>
        )}
        {capturedVideo && (
          <div className="flex items-center gap-2">
            <Button
              className="flex items-center gap-2"
              onClick={() => {
                setCapturedVideo(undefined)
                setRecorder(new VideoRecorder(fileName))
                setIsRecorderReady(false)
              }}
            >
              Retry
            </Button>
            <Button primary className="flex items-center gap-2" onClick={saveVideo}>
              <Icon type="upload" />
              Upload
            </Button>
          </div>
        )}
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default observer(VideoCaptureModal)
