import { compareSemVersions } from '@standardnotes/snjs'
import { keyboardStringForShortcut, OPEN_PREFERENCES_COMMAND } from '@standardnotes/ui-services'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApplication } from '../ApplicationProvider'
import { useCommandService } from '../CommandProvider'
import Icon from '../Icon/Icon'
import StyledTooltip from '../StyledTooltip/StyledTooltip'

type Props = {
  openPreferences: (openWhatsNew: boolean) => void
}

const PreferencesButton = ({ openPreferences }: Props) => {
  const application = useApplication()

  const commandService = useCommandService()
  const shortcut = useMemo(
    () => keyboardStringForShortcut(commandService.keyboardShortcutForCommand(OPEN_PREFERENCES_COMMAND)),
    [commandService],
  )

  const [changelogLastReadVersion, setChangelogLastReadVersion] = useState(() =>
    application.changelogService.getLastReadVersion(),
  )
  const isChangelogUnread = useMemo(
    () => (changelogLastReadVersion ? compareSemVersions(application.version, changelogLastReadVersion) > 0 : false),
    [application.version, changelogLastReadVersion],
  )
  useEffect(
    () => application.changelogService.addLastReadChangeListener(setChangelogLastReadVersion),
    [application.changelogService],
  )

  const onClick = useCallback(() => {
    openPreferences(isChangelogUnread)
  }, [isChangelogUnread, openPreferences])

  return (
    <StyledTooltip label={`Open preferences (${shortcut})`}>
      <button onClick={onClick} className="relative flex h-full w-8 cursor-pointer items-center justify-center">
        <div className="h-5">
          <Icon type="tune" className="rounded hover:text-info" />
        </div>
        {isChangelogUnread && <div className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-info" />}
      </button>
    </StyledTooltip>
  )
}

export default PreferencesButton
