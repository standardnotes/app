import { classNames, FeatureIdentifier, FeatureStatus } from '@standardnotes/snjs'
import Icon from '../Icon/Icon'
import MenuItem from '../Menu/MenuItem'
import { MenuItemIconSize } from '@/Constants/TailwindClassNames'
import { useRef, useState } from 'react'
import Popover from '../Popover/Popover'
import Menu from '../Menu/Menu'
import { ClassicFileReader } from '@standardnotes/filepicker'
import {
  AegisToAuthenticatorConverter,
  EvernoteConverter,
  GoogleKeepConverter,
  SimplenoteConverter,
} from '@standardnotes/ui-services'
import { useApplication } from '../ApplicationProvider'

const iconClassName = classNames('mr-2 text-neutral', MenuItemIconSize)

const ImportMenuOption = () => {
  const application = useApplication()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const togglePopover = () => {
    setIsMenuOpen((isOpen) => !isOpen)
  }

  return (
    <>
      <MenuItem ref={anchorRef} onClick={togglePopover}>
        <Icon type="upload" className={iconClassName} />
        Import
        <Icon type="chevron-right" className={`ml-auto text-neutral ${MenuItemIconSize}`} />
      </MenuItem>
      <Popover
        anchorElement={anchorRef.current}
        className="py-2"
        open={isMenuOpen}
        side="right"
        align="end"
        togglePopover={togglePopover}
      >
        <Menu a11yLabel="Import options menu" isOpen={isMenuOpen}>
          <MenuItem
            onClick={() => {
              setIsMenuOpen((isOpen) => !isOpen)
            }}
          >
            <Icon type="plain-text" className={iconClassName} />
            Plaintext
          </MenuItem>
          <MenuItem
            onClick={async () => {
              const files = await ClassicFileReader.selectFiles()
              files.forEach(async (file) => {
                const converter = new GoogleKeepConverter(application)
                const noteTransferPayload = await converter.convertGoogleKeepBackupFileToNote(file, false)
                void converter.importFromTransferPayloads([noteTransferPayload])
              })
            }}
          >
            <Icon type="plain-text" className={iconClassName} />
            Google Keep
          </MenuItem>
          <MenuItem
            onClick={async () => {
              const files = await ClassicFileReader.selectFiles()
              files.forEach(async (file) => {
                const converter = new EvernoteConverter(application)
                const noteAndTagPayloads = await converter.convertENEXFileToNotesAndTags(file, true)
                void converter.importFromTransferPayloads(noteAndTagPayloads)
              })
            }}
          >
            <Icon type="rich-text" className={iconClassName} />
            Evernote
          </MenuItem>
          <MenuItem
            onClick={async () => {
              const files = await ClassicFileReader.selectFiles()
              files.forEach(async (file) => {
                const converter = new SimplenoteConverter(application)
                const noteTransferPayloads = await converter.convertSimplenoteBackupFileToNotes(file)
                void converter.importFromTransferPayloads(noteTransferPayloads)
              })
            }}
          >
            <Icon type="rich-text" className={iconClassName} />
            Simplenote
          </MenuItem>
          <MenuItem
            onClick={async () => {
              const files = await ClassicFileReader.selectFiles()
              const isEntitledToAuthenticator =
                application.features.getFeatureStatus(FeatureIdentifier.TokenVaultEditor) === FeatureStatus.Entitled
              files.forEach(async (file) => {
                const converter = new AegisToAuthenticatorConverter(application)
                const noteTransferPayload = await converter.convertAegisBackupFileToNote(
                  file,
                  isEntitledToAuthenticator,
                )
                void converter.importFromTransferPayloads([noteTransferPayload])
              })
            }}
          >
            <Icon type="lock-filled" className={iconClassName} />
            Aegis
          </MenuItem>
        </Menu>
      </Popover>
    </>
  )
}

export default ImportMenuOption
