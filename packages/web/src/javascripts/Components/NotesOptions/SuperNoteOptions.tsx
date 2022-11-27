import { SNNote } from '@standardnotes/snjs'
import {
  PlatformedKeyboardShortcut,
  SUPER_EXPORT_HTML,
  SUPER_EXPORT_JSON,
  SUPER_EXPORT_MARKDOWN,
} from '@standardnotes/ui-services'
import { useRef, useState } from 'react'
import { useCommandService } from '../ApplicationView/CommandProvider'
import Icon from '../Icon/Icon'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import Menu from '../Menu/Menu'
import MenuItem from '../Menu/MenuItem'
import Popover from '../Popover/Popover'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { iconClass } from './ClassNames'

type Props = {
  note: SNNote
  markdownShortcut?: PlatformedKeyboardShortcut
  enableSuperMarkdownPreview: () => void
}

const SuperNoteOptions = ({ note, markdownShortcut, enableSuperMarkdownPreview }: Props) => {
  const commandService = useCommandService()

  const exportButtonRef = useRef<HTMLButtonElement>(null)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)

  return (
    <>
      <HorizontalSeparator classes="my-2" />

      <div className="my-1 px-3 text-base font-semibold uppercase text-text lg:text-xs">Super</div>

      <MenuItem onClick={enableSuperMarkdownPreview}>
        <Icon type="markdown" className={iconClass} />
        Show Markdown
        {markdownShortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={markdownShortcut} />}
      </MenuItem>

      <MenuItem
        ref={exportButtonRef}
        onClick={() => {
          setIsExportMenuOpen((open) => !open)
        }}
      >
        <div className="flex items-center">
          <Icon type="download" className={iconClass} />
          Export
        </div>
        <Icon type="chevron-right" className="ml-auto text-neutral" />
      </MenuItem>
      <Popover
        side="left"
        align="start"
        open={isExportMenuOpen}
        anchorElement={exportButtonRef.current}
        togglePopover={() => {
          setIsExportMenuOpen(!isExportMenuOpen)
        }}
        className="py-1"
      >
        <Menu a11yLabel={'Super note export menu'} isOpen={isExportMenuOpen}>
          <MenuItem onClick={() => commandService.triggerCommand(SUPER_EXPORT_JSON, note.title)}>
            <Icon type="code" className={iconClass} />
            Export as JSON
          </MenuItem>
          <MenuItem onClick={() => commandService.triggerCommand(SUPER_EXPORT_MARKDOWN, note.title)}>
            <Icon type="markdown" className={iconClass} />
            Export as Markdown
          </MenuItem>
          <MenuItem onClick={() => commandService.triggerCommand(SUPER_EXPORT_HTML, note.title)}>
            <Icon type="rich-text" className={iconClass} />
            Export as HTML
          </MenuItem>
        </Menu>
      </Popover>
    </>
  )
}

export default SuperNoteOptions
