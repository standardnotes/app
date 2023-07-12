import { useApplication } from '@/Components/ApplicationProvider'
import { ApplicationEvent, PrefKey, PrefDefaults } from '@standardnotes/snjs'
import { useEffect, useState } from 'react'

export default function usePreference<Key extends PrefKey>(preference: Key) {
  const application = useApplication()

  const [value, setValue] = useState(application.getPreference(preference, PrefDefaults[preference]))

  useEffect(() => {
    return application.addEventObserver(async () => {
      const latestValue = application.getPreference(preference, PrefDefaults[preference])

      setValue(latestValue)
    }, ApplicationEvent.PreferencesChanged)
  }, [application, preference])

  return value
}
