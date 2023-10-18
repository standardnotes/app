import { SNNote } from '@standardnotes/snjs'
import { PlatformedKeyboardShortcut } from '@standardnotes/ui-services'
import Icon from '../Icon/Icon'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import MenuItem from '../Menu/MenuItem'
import { iconClass } from './ClassNames'
import MenuSection from '../Menu/MenuSection'

type Props = {
  note: SNNote
  markdownShortcut?: PlatformedKeyboardShortcut
  enableSuperMarkdownPreview: () => void
}

const SuperNoteOptions = ({ markdownShortcut, enableSuperMarkdownPreview }: Props) => {
  return (
    <MenuSection>
      <MenuItem onClick={enableSuperMarkdownPreview}>
        <Icon type="markdown" className={iconClass} />
        Show Markdown
        {markdownShortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={markdownShortcut} />}
      </MenuItem>
    </MenuSection>
  )
}

export default SuperNoteOptions
