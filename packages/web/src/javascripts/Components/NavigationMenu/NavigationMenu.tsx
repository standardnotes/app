import { PaneLayout } from '@/Controllers/PaneController/PaneLayout'
import useIsTabletOrMobileScreen from '@/Hooks/useIsTabletOrMobileScreen'
import { StatusServiceEvent, classNames } from '@standardnotes/snjs'
import RoundIconButton from '../Button/RoundIconButton'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'
import { useState, useEffect } from 'react'
import { useApplication } from '../ApplicationProvider'
import CountBubble from '../Preferences/PreferencesComponents/CountBubble'

/** This button is displayed in the items list header */
export const NavigationMenuButton = () => {
  const application = useApplication()
  const { setPaneLayout } = useResponsiveAppPane()
  const { isTabletOrMobile, isMobile } = useIsTabletOrMobileScreen()

  const [bubbleCount, setBubbleCount] = useState<string | undefined>(() => {
    return application.status.totalPreferencesBubbleCount
      ? application.status.totalPreferencesBubbleCount.toString()
      : undefined
  })
  useEffect(() => {
    return application.status.addEventObserver((event, message) => {
      if (event !== StatusServiceEvent.PreferencesBubbleCountChanged) {
        return
      }
      setBubbleCount(message)
    })
  }, [application.status])

  return (
    <div className={classNames(isTabletOrMobile ? 'flex' : 'hidden', 'relative h-10 w-10', 'mr-3')}>
      <RoundIconButton
        onClick={() => {
          setPaneLayout(PaneLayout.TagSelection)
        }}
        label="Open navigation menu"
        icon="menu-variant"
      />
      {isMobile && bubbleCount && <CountBubble position="right" count={bubbleCount} />}
    </div>
  )
}
