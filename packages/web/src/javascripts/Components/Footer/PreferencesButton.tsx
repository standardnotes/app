import { compareSemVersions, StatusServiceEvent } from '@standardnotes/snjs'
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
  const isChangelogUnread = useMemo(() => {
    return changelogLastReadVersion && !application.isNativeMobileWeb()
      ? compareSemVersions(application.version, changelogLastReadVersion) > 0
      : false
  }, [application, changelogLastReadVersion])
  useEffect(
    () => application.changelogService.addLastReadChangeListener(setChangelogLastReadVersion),
    [application.changelogService],
  )

  const onClick = useCallback(() => {
    openPreferences(isChangelogUnread)
  }, [isChangelogUnread, openPreferences])

  const [bubbleCount, setBubbleCount] = useState<string | undefined>()
  useEffect(() => {
    return application.status.addEventObserver((event, message) => {
      if (event !== StatusServiceEvent.PreferencesBubbleCountChanged) {
        return
      }
      setBubbleCount(message)
    })
  }, [application.status])

  return (
    <StyledTooltip label={`Open preferences (${shortcut})`}>
      <button onClick={onClick} className="group relative flex h-full w-8 cursor-pointer items-center justify-center">
        <div className="relative h-5">
          <Icon type="tune" className="rounded group-hover:text-info" />
          {bubbleCount && (
            <div className="absolute left-full bottom-full -translate-x-1/2 translate-y-1/2 py-px px-1.5 text-[0.575rem] rounded-full border border-info-contrast text-info-contrast bg-info font-bold aspect-square">
              {bubbleCount}
            </div>
          )}
        </div>
        {isChangelogUnread && <div className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-info" />}
      </button>
    </StyledTooltip>
  )
}

export default PreferencesButton
