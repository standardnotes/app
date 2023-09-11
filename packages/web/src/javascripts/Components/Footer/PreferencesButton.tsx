import { compareSemVersions, StatusServiceEvent } from '@standardnotes/snjs'
import { keyboardStringForShortcut, OPEN_PREFERENCES_COMMAND } from '@standardnotes/ui-services'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApplication } from '../ApplicationProvider'
import { useCommandService } from '../CommandProvider'
import Icon from '../Icon/Icon'
import StyledTooltip from '../StyledTooltip/StyledTooltip'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import RoundIconButton from '../Button/RoundIconButton'
import CountBubble from '../Preferences/PreferencesComponents/CountBubble'

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

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  if (isMobileScreen) {
    return (
      <div className="relative">
        <RoundIconButton className="ml-2.5 bg-default" onClick={onClick} label="Go to preferences" icon="tune" />
        <CountBubble position="right" count={bubbleCount} />
      </div>
    )
  }

  return (
    <StyledTooltip label={`Open preferences (${shortcut})`}>
      <button onClick={onClick} className="group relative flex h-full w-8 cursor-pointer items-center justify-center">
        <div className="relative h-5">
          <Icon type="tune" className="rounded group-hover:text-info" />
          <CountBubble position="right" count={bubbleCount} />
        </div>
        {isChangelogUnread && <div className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-info" />}
      </button>
    </StyledTooltip>
  )
}

export default PreferencesButton
