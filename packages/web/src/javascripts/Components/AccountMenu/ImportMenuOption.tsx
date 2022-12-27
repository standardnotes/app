import { classNames, ContentType, DecryptedPayload } from '@standardnotes/snjs'
import Icon from '../Icon/Icon'
import MenuItem from '../Menu/MenuItem'
import { MenuItemIconSize } from '@/Constants/TailwindClassNames'
import { useRef, useState } from 'react'
import Popover from '../Popover/Popover'
import Menu from '../Menu/Menu'
import { ClassicFileReader } from '@standardnotes/filepicker'
import { AegisToAuthenticatorConverter } from '@standardnotes/ui-services'
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
            onClick={() => {
              setIsMenuOpen((isOpen) => !isOpen)
            }}
          >
            <Icon type="plain-text" className={iconClassName} />
            Google Keep
          </MenuItem>
          <MenuItem
            onClick={() => {
              setIsMenuOpen((isOpen) => !isOpen)
            }}
          >
            <Icon type="rich-text" className={iconClassName} />
            Evernote
          </MenuItem>
          <MenuItem
            onClick={() => {
              setIsMenuOpen((isOpen) => !isOpen)
            }}
          >
            <Icon type="rich-text" className={iconClassName} />
            Simplenote
          </MenuItem>
          <MenuItem
            onClick={async () => {
              const files = await ClassicFileReader.selectFiles()
              files.forEach(async (file) => {
                const converter = new AegisToAuthenticatorConverter(application)
                const noteTransferPayload = await converter.convertAegisBackupFileToNote(file)
                const noteItem = application.items.createTemplateItem(
                  ContentType.Note,
                  noteTransferPayload.content,
                  new DecryptedPayload(noteTransferPayload),
                )
                await application.items.insertItem(noteItem)
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
