import { SNNote, WebAppEvent } from '@standardnotes/snjs'
import { PlatformedKeyboardShortcut } from '@standardnotes/ui-services'
import { useRef, useState } from 'react'
import { useApplication } from '../ApplicationView/ApplicationProvider'
import Icon from '../Icon/Icon'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import Menu from '../Menu/Menu'
import MenuItem from '../Menu/MenuItem'
import Popover from '../Popover/Popover'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { iconClass, menuItemClassNames, menuItemSwitchClassNames } from './ClassNames'

type Props = {
  note: SNNote
  markdownShortcut?: PlatformedKeyboardShortcut
  enableSuperMarkdownPreview: () => void
}

const SuperNoteOptions = ({ note, markdownShortcut, enableSuperMarkdownPreview }: Props) => {
  const application = useApplication()
  const exportButtonRef = useRef<HTMLButtonElement>(null)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)

  return (
    <>
      <HorizontalSeparator classes="my-2" />

      <div className="my-1 px-3 text-base font-semibold uppercase text-text lg:text-xs">Super</div>

      <button className={menuItemClassNames} onClick={enableSuperMarkdownPreview}>
        <div className="flex w-full items-center justify-between">
          <span className="flex">
            <Icon type="markdown" className={iconClass} />
            Show Markdown
          </span>
          {markdownShortcut && <KeyboardShortcutIndicator shortcut={markdownShortcut} />}
        </div>
      </button>

      <button
        ref={exportButtonRef}
        className={menuItemSwitchClassNames}
        onClick={() => {
          setIsExportMenuOpen((open) => !open)
        }}
      >
        <div className="flex items-center">
          <Icon type="download" className={iconClass} />
          Export
        </div>
        <Icon type="chevron-right" className="text-neutral" />
      </button>
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
          <MenuItem onClick={() => application.notifyWebEvent(WebAppEvent.SuperNoteExportJson, note.title)}>
            <Icon type="code" className={iconClass} />
            Export as JSON
          </MenuItem>
          <MenuItem onClick={() => application.notifyWebEvent(WebAppEvent.SuperNoteExportMarkdown, note.title)}>
            <Icon type="markdown" className={iconClass} />
            Export as Markdown
          </MenuItem>
          <MenuItem onClick={() => application.notifyWebEvent(WebAppEvent.SuperNoteExportHtml, note.title)}>
            <Icon type="rich-text" className={iconClass} />
            Export as HTML
          </MenuItem>
        </Menu>
      </Popover>
    </>
  )
}

export default SuperNoteOptions
