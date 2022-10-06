import { WebApplication } from '@/Application/Application'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { ApplicationEvent, PrefKey } from '@standardnotes/snjs'
import { useEffect } from 'react'

type Props = {
  application: WebApplication
}

const DarkModeHandler = ({ application }: Props) => {
  useEffect(() => {
    application.addSingleEventObserver(ApplicationEvent.PreferencesChanged, async () => {
      const isDarkModeOn = application.getPreference(PrefKey.DarkMode, PrefDefaults[PrefKey.DarkMode])

      if (isDarkModeOn) {
        document.documentElement.classList.add('dark-mode')
      } else {
        document.documentElement.classList.remove('dark-mode')
      }
    })
  }, [application])

  return null
}

export default DarkModeHandler
