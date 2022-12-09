import PhotoCaptureModal from '@/Components/CameraCaptureModal/PhotoCaptureModal'
import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import Popover from '@/Components/Popover/Popover'
import { FilesController } from '@/Controllers/FilesController'
import { PhotoRecorder } from '@/Controllers/Moments/PhotoRecorder'
import { classNames } from '@standardnotes/snjs'
import { useEffect, useRef, useState } from 'react'

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
  const [showCameraCaptureModal, setCameraCaptureModal] = useState(false)

  useEffect(() => {
    const setCameraSupport = async () => {
      setDeviceHasCamera(await PhotoRecorder.isSupported())
    }

    void setCameraSupport()
  }, [])

  const canShowMenu = isInFilesSmartView && deviceHasCamera

  return (
    <>
      <button
        className={classNames(
          'hidden md:flex',
          'h-8 w-8 hover:brightness-125',
          'z-editor-title-bar ml-3  cursor-pointer items-center',
          `justify-center rounded-full border border-solid border-transparent ${
            isDailyEntry ? 'bg-danger text-danger-contrast' : 'bg-info text-info-contrast'
          }`,
        )}
        title={addButtonLabel}
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
      <Popover
        open={canShowMenu && isMenuOpen}
        anchorElement={addItemButtonRef.current}
        togglePopover={() => {
          setIsMenuOpen((isOpen) => !isOpen)
        }}
        side="bottom"
        align="center"
        className="py-2"
      >
        <Menu a11yLabel={'test'} isOpen={isMenuOpen}>
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
              setCameraCaptureModal(true)
              setIsMenuOpen(false)
            }}
          >
            <Icon type="camera" className="mr-2" />
            Take photo
          </MenuItem>
          <MenuItem
            onClick={async () => {
              // setCameraCaptureModal(true)
              // setIsMenuOpen(false)
            }}
          >
            <Icon type="camera" className="mr-2" />
            Record video
          </MenuItem>
        </Menu>
      </Popover>
      {showCameraCaptureModal && (
        <PhotoCaptureModal
          filesController={filesController}
          close={() => {
            setCameraCaptureModal(false)
          }}
        />
      )}
    </>
  )
}

export default AddItemMenuButton
