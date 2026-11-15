import Icon from '../Icon/Icon'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import MenuItem from '../Menu/MenuItem'
import { iconClass } from './ClassNames'
import MenuSection from '../Menu/MenuSection'
import { UNIVERSAL_TOGGLE_SEARCH } from '@standardnotes/ui-services'
import { useCallback } from 'react'
import { c } from 'ttag'
import { useKeyboardService } from '../KeyboardServiceProvider'
import { useKeyboardShortcut } from '@/Hooks/useKeyboardShortcut'

type Props = {
  closeMenu: () => void
}

const PlainNoteOptions = ({ closeMenu }: Props) => {
  const keyboardService = useKeyboardService()

  const findShortcut = useKeyboardShortcut(keyboardService, UNIVERSAL_TOGGLE_SEARCH)

  const findInNote = useCallback(() => {
    keyboardService.triggerCommand(UNIVERSAL_TOGGLE_SEARCH)
    closeMenu()
  }, [closeMenu, keyboardService])

  return (
    <MenuSection>
      <MenuItem onClick={findInNote}>
        <Icon type="search" className={iconClass} />
        {c('B4.Notes.EditorOptions.Action').t`Find in note`}
        {findShortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={findShortcut} />}
      </MenuItem>
    </MenuSection>
  )
}

export default PlainNoteOptions
