import { keyboardStringForShortcut, OPEN_PREFERENCES_COMMAND } from '@standardnotes/ui-services'
import { useMemo } from 'react'
import { useCommandService } from '../CommandProvider'
import Icon from '../Icon/Icon'
import StyledTooltip from '../StyledTooltip/StyledTooltip'

type Props = {
  openPreferences: () => void
}

const PreferencesButton = ({ openPreferences }: Props) => {
  const commandService = useCommandService()

  const shortcut = useMemo(
    () => keyboardStringForShortcut(commandService.keyboardShortcutForCommand(OPEN_PREFERENCES_COMMAND)),
    [commandService],
  )

  return (
    <StyledTooltip label={`Open preferences (${shortcut})`}>
      <button onClick={openPreferences} className="flex h-full w-8 cursor-pointer items-center justify-center">
        <div className="h-5">
          <Icon type="tune" className="rounded hover:text-info" />
        </div>
      </button>
    </StyledTooltip>
  )
}

export default PreferencesButton
