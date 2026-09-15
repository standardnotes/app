import Icon from '../Icon/Icon'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import MenuItem from '../Menu/MenuItem'
import { iconClass } from './ClassNames'
import MenuSection from '../Menu/MenuSection'
import { UNIVERSAL_TOGGLE_SEARCH } from '@standardnotes/ui-services'
import { useMemo, useCallback } from 'react'
import { useKeyboardService } from '../KeyboardServiceProvider'

type Props = {
  closeMenu: () => void
}

const PlainNoteOptions = ({ closeMenu }: Props) => {
  const keyboardService = useKeyboardService()

  const findShortcut = useMemo(
    () => keyboardService.keyboardShortcutForCommand(UNIVERSAL_TOGGLE_SEARCH),
    [keyboardService],
  )

  const findInNote = useCallback(() => {
    keyboardService.triggerCommand(UNIVERSAL_TOGGLE_SEARCH)
    closeMenu()
  }, [closeMenu, keyboardService])

  return (
    <MenuSection>
      <MenuItem onClick={findInNote}>
        <Icon type="search" className={iconClass} />
        Find in note
        {findShortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={findShortcut} />}
      </MenuItem>
    </MenuSection>
  )
}

export default PlainNoteOptions
