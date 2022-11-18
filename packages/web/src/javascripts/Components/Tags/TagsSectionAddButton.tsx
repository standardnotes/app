import IconButton from '@/Components/Button/IconButton'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { CREATE_NEW_TAG_COMMAND, keyboardStringForShortcut } from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useMemo } from 'react'
import { useApplication } from '../ApplicationView/ApplicationProvider'

type Props = {
  tags: NavigationController
  features: FeaturesController
}

const TagsSectionAddButton: FunctionComponent<Props> = ({ tags }) => {
  const application = useApplication()

  const shortcut = useMemo(
    () => keyboardStringForShortcut(application.keyboardService.keyboardShortcutForCommand(CREATE_NEW_TAG_COMMAND)),
    [application],
  )
  return (
    <IconButton
      focusable={true}
      icon="add"
      title={`Create a new tag (${shortcut})`}
      className="p-0 text-neutral"
      onClick={() => tags.createNewTemplate()}
    />
  )
}

export default observer(TagsSectionAddButton)
