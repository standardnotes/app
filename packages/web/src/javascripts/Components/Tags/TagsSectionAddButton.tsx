import IconButton from '@/Components/Button/IconButton'
import { CREATE_NEW_TAG_COMMAND, keyboardStringForShortcut } from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { useCallback, useMemo } from 'react'
import { useKeyboardService } from '../KeyboardServiceProvider'
import { useApplication } from '../ApplicationProvider'

function TagsSectionAddButton() {
  const application = useApplication()
  const keyboardService = useKeyboardService()

  const addNewTag = useCallback(
    () => application.navigationController.createNewTemplate(),
    [application.navigationController],
  )

  const shortcut = useMemo(
    () => keyboardStringForShortcut(keyboardService.keyboardShortcutForCommand(CREATE_NEW_TAG_COMMAND)),
    [keyboardService],
  )

  return (
    <IconButton
      focusable={true}
      icon="add"
      title={`Create a new tag (${shortcut})`}
      className="p-0 text-neutral"
      onClick={addNewTag}
    />
  )
}

export default observer(TagsSectionAddButton)
