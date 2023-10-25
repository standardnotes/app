import PhotoCaptureModal from '@/Components/CameraCaptureModal/PhotoCaptureModal'
import VideoCaptureModal from '@/Components/CameraCaptureModal/VideoCaptureModal'
import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import Popover from '@/Components/Popover/Popover'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import { FilesController } from '@/Controllers/FilesController'
import { PhotoRecorder } from '@/Controllers/Moments/PhotoRecorder'
import { classNames } from '@standardnotes/snjs'
import { useEffect, useRef, useState } from 'react'
import StyledTooltip from '@/Components/StyledTooltip/StyledTooltip'

type Props = {
  isDailyEntry: boolean
  isInFilesSmartView: boolean
  addButtonLabel: string
  addNewItem: () => void
  filesController: FilesController
}

const AddItemMenuButton = ({
  filesController,
  isDailyEntry,
  addButtonLabel,
  isInFilesSmartView,
  addNewItem,
}: Props) => {
  const addItemButtonRef = useRef<HTMLButtonElement>(null)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [deviceHasCamera, setDeviceHasCamera] = useState(false)
  const [captureType, setCaptureType] = useState<'photo' | 'video'>()

  useEffect(() => {
    const setCameraSupport = async () => {
      setDeviceHasCamera(await PhotoRecorder.isSupported())
    }

    void setCameraSupport()
  }, [])

  const canShowMenu = isInFilesSmartView && deviceHasCamera

  const closeCaptureModal = () => {
    setCaptureType(undefined)
  }

  return (
    <>
      <StyledTooltip label={addButtonLabel}>
        <button
          className={classNames(
            'z-editor-title-bar hidden h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-transparent hover:brightness-125 md:flex',
            isDailyEntry ? 'bg-danger text-danger-contrast' : 'bg-info text-info-contrast',
          )}
          aria-label={addButtonLabel}
          onClick={() => {
            if (canShowMenu) {
              setIsMenuOpen((isOpen) => !isOpen)
            } else {
              addNewItem()
            }
          }}
          ref={addItemButtonRef}
        >
          <Icon type="add" size="custom" className="h-5 w-5" />
        </button>
      </StyledTooltip>
      {canShowMenu && (
        <Popover
          title="Add item"
          open={isMenuOpen}
          anchorElement={addItemButtonRef}
          togglePopover={() => {
            setIsMenuOpen((isOpen) => !isOpen)
          }}
          side="bottom"
          align="center"
          className="py-2"
        >
          <Menu a11yLabel={'test'}>
            <MenuItem
              onClick={() => {
                addNewItem()
                setIsMenuOpen(false)
              }}
            >
              <Icon type="add" className="mr-2" />
              {addButtonLabel}
            </MenuItem>
            <MenuItem
              onClick={async () => {
                setCaptureType('photo')
                setIsMenuOpen(false)
              }}
            >
              <Icon type="camera" className="mr-2" />
              Take photo
            </MenuItem>
            <MenuItem
              onClick={async () => {
                setCaptureType('video')
                setIsMenuOpen(false)
              }}
            >
              <Icon type="camera" className="mr-2" />
              Record video
            </MenuItem>
          </Menu>
        </Popover>
      )}
      <ModalOverlay isOpen={captureType === 'photo'} close={closeCaptureModal}>
        <PhotoCaptureModal filesController={filesController} close={closeCaptureModal} />
      </ModalOverlay>
      <ModalOverlay isOpen={captureType === 'video'} close={closeCaptureModal}>
        <VideoCaptureModal filesController={filesController} close={closeCaptureModal} />
      </ModalOverlay>
    </>
  )
}

export default AddItemMenuButton
