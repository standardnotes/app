import Icon from '../Icon/Icon'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import MenuItem from '../Menu/MenuItem'
import { iconClass } from './ClassNames'
import MenuSection from '../Menu/MenuSection'
import { SUPER_SHOW_MARKDOWN_PREVIEW, SUPER_TOGGLE_SEARCH } from '@standardnotes/ui-services'
import { useMemo, useCallback } from 'react'
import { useKeyboardService } from '../KeyboardServiceProvider'
import { c } from 'ttag'

type Props = {
  closeMenu: () => void
}

const SuperNoteOptions = ({ closeMenu }: Props) => {
  const keyboardService = useKeyboardService()

  const markdownShortcut = useMemo(
    () => keyboardService.keyboardShortcutForCommand(SUPER_SHOW_MARKDOWN_PREVIEW),
    [keyboardService],
  )

  const findShortcut = useMemo(() => keyboardService.keyboardShortcutForCommand(SUPER_TOGGLE_SEARCH), [keyboardService])

  const enableSuperMarkdownPreview = useCallback(() => {
    keyboardService.triggerCommand(SUPER_SHOW_MARKDOWN_PREVIEW)
  }, [keyboardService])

  const findInNote = useCallback(() => {
    keyboardService.triggerCommand(SUPER_TOGGLE_SEARCH)
    closeMenu()
  }, [closeMenu, keyboardService])

  return (
    <MenuSection>
      <MenuItem onClick={findInNote}>
        <Icon type="search" className={iconClass} />
        {c('B4.Notes.EditorOptions.Action').t`Find in note`}
        {findShortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={findShortcut} />}
      </MenuItem>
      <MenuItem onClick={enableSuperMarkdownPreview}>
        <Icon type="markdown" className={iconClass} />
        {c('B4.Notes.EditorOptions.Action').t`Show Markdown`}
        {markdownShortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={markdownShortcut} />}
      </MenuItem>
    </MenuSection>
  )
}

export default SuperNoteOptions
