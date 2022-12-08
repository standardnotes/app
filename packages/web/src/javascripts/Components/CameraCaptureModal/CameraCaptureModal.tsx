import { FilesController } from '@/Controllers/FilesController'
import { PhotoRecorder } from '@/Controllers/Moments/PhotoRecorder'
import { VideoRecorder } from '@/Controllers/Moments/VideoRecorder'
import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '../Button/Button'
import DecoratedInput from '../Input/DecoratedInput'
import ModalDialog from '../Shared/ModalDialog'
import ModalDialogButtons from '../Shared/ModalDialogButtons'
import ModalDialogDescription from '../Shared/ModalDialogDescription'
import ModalDialogLabel from '../Shared/ModalDialogLabel'

type Props = {
  filesController: FilesController
  type: 'photo' | 'video'
  close: () => void
}

const CameraCaptureModal = ({ filesController, type, close }: Props) => {
  const [fileName, setFileName] = useState('')
  const [recorder] = useState(() => (type === 'photo' ? new PhotoRecorder(fileName) : new VideoRecorder(fileName)))

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
    }

    void init()

    return () => {
      if (recorder instanceof PhotoRecorder) {
        recorder.finish()
      } else {
        void recorder.stop()
      }
    }
  }, [recorder])

  const takePhoto = useCallback(async () => {
    if (!fileName) {
      fileNameInputRef.current?.focus()
      return
    }
    if (recorder instanceof PhotoRecorder) {
      const file = await recorder.takePhoto()
      if (!file) {
        return
      }

      const namedFile = new File([file], fileName, { type: file.type })

      void filesController.uploadNewFile(namedFile)

      close()
    }
  }, [fileName, recorder, filesController, close])

  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={close}>{type === 'photo' ? 'Take a photo' : 'Record a video'}</ModalDialogLabel>
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
          <div className="mt-1 w-full" ref={previewRef}></div>
        </div>
      </ModalDialogDescription>
      <ModalDialogButtons>
        <Button
          onClick={() => {
            if (type === 'photo') {
              void takePhoto()
            } else {
              //
            }
          }}
        >
          {type === 'photo' ? 'Take photo' : 'Record video'}
        </Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default CameraCaptureModal
