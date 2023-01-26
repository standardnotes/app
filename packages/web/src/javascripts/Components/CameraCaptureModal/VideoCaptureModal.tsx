import { FilesController } from '@/Controllers/FilesController'
import { VideoRecorder } from '@/Controllers/Moments/VideoRecorder'
import { formatDateAndTimeForNote } from '@/Utils/DateUtils'
import { classNames } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon/Icon'
import DecoratedInput from '../Input/DecoratedInput'
import Modal from '../Modal/Modal'

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

  const stopRecording = async () => {
    const capturedVideo = await recorder.stop()
    setIsRecording(false)
    setCapturedVideo(capturedVideo)
  }

  const retryRecording = () => {
    setCapturedVideo(undefined)
    setRecorder(new VideoRecorder(fileName))
    setIsRecorderReady(false)
  }

  return (
    <Modal
      title="Record a video"
      close={close}
      actions={[
        {
          label: 'Cancel',
          onClick: close,
          type: 'cancel',
          mobileSlot: 'left',
        },
        {
          label: 'Record',
          onClick: startRecording,
          type: 'primary',
          mobileSlot: 'right',
          hidden: !!capturedVideo || isRecording,
        },
        {
          label: 'Stop',
          onClick: stopRecording,
          type: 'primary',
          mobileSlot: 'right',
          hidden: !!capturedVideo || !isRecording,
        },
        {
          label: 'Retry',
          onClick: retryRecording,
          type: 'secondary',
          hidden: !capturedVideo,
        },
        {
          label: 'Upload',
          onClick: saveVideo,
          type: 'primary',
          mobileSlot: 'right',
          hidden: !capturedVideo,
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
          <div className={classNames('mt-1 w-full', capturedVideo && 'hidden')} ref={previewRef}></div>
          {capturedVideo && (
            <div className="mt-1 w-full">
              <video src={capturedVideoObjectURL} controls />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default observer(VideoCaptureModal)
