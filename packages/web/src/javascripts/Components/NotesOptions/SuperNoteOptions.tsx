import Icon from '../Icon/Icon'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import MenuItem from '../Menu/MenuItem'
import { iconClass } from './ClassNames'
import MenuSection from '../Menu/MenuSection'
import { SUPER_SHOW_MARKDOWN_PREVIEW, SUPER_TOGGLE_SEARCH } from '@standardnotes/ui-services'
import { useMemo, useCallback } from 'react'
import { useCommandService } from '../CommandProvider'

type Props = {
  closeMenu: () => void
}

const SuperNoteOptions = ({ closeMenu }: Props) => {
  const commandService = useCommandService()

  const markdownShortcut = useMemo(
    () => commandService.keyboardShortcutForCommand(SUPER_SHOW_MARKDOWN_PREVIEW),
    [commandService],
  )

  const findShortcut = useMemo(() => commandService.keyboardShortcutForCommand(SUPER_TOGGLE_SEARCH), [commandService])

  const enableSuperMarkdownPreview = useCallback(() => {
    commandService.triggerCommand(SUPER_SHOW_MARKDOWN_PREVIEW)
  }, [commandService])

  const findInNote = useCallback(() => {
    commandService.triggerCommand(SUPER_TOGGLE_SEARCH)
    closeMenu()
  }, [closeMenu, commandService])

  return (
    <MenuSection>
      <MenuItem onClick={findInNote}>
        <Icon type="search" className={iconClass} />
        Find in note
        {findShortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={findShortcut} />}
      </MenuItem>
      <MenuItem onClick={enableSuperMarkdownPreview}>
        <Icon type="markdown" className={iconClass} />
        Show Markdown
        {markdownShortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={markdownShortcut} />}
      </MenuItem>
    </MenuSection>
  )
}

export default SuperNoteOptions
