import IconButton from '@/Components/Button/IconButton'
import { CREATE_NEW_TAG_COMMAND, keyboardStringForShortcut } from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { useCallback, useMemo } from 'react'
import { useKeyboardService } from '../KeyboardServiceProvider'
import { useApplication } from '../ApplicationProvider'
import { c } from 'ttag'

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

  const title = useMemo(
    () => c('B4.Notes.TagsLinkedItems.Action').jt`Create a new tag (${shortcut})` as unknown as string,
    [shortcut],
  )

  return <IconButton focusable={true} icon="add" title={title} className="p-0 text-neutral" onClick={addNewTag} />
}

export default observer(TagsSectionAddButton)
