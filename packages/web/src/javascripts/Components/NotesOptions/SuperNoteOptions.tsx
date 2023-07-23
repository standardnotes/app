import { SNNote } from '@standardnotes/snjs'
import { PlatformedKeyboardShortcut } from '@standardnotes/ui-services'
import Icon from '../Icon/Icon'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import MenuItem from '../Menu/MenuItem'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { iconClass } from './ClassNames'

type Props = {
  note: SNNote
  markdownShortcut?: PlatformedKeyboardShortcut
  enableSuperMarkdownPreview: () => void
}

const SuperNoteOptions = ({ markdownShortcut, enableSuperMarkdownPreview }: Props) => {
  return (
    <>
      <HorizontalSeparator classes="my-2" />

      <div className="my-1 px-3 text-base font-semibold uppercase text-text lg:text-xs">Super</div>

      <MenuItem onClick={enableSuperMarkdownPreview}>
        <Icon type="markdown" className={iconClass} />
        Show Markdown
        {markdownShortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={markdownShortcut} />}
      </MenuItem>
    </>
  )
}

export default SuperNoteOptions
