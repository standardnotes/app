import { useApplication } from '@/Components/ApplicationProvider'
import { ApplicationEvent, PrefKey } from '@standardnotes/snjs'
import { useEffect, useState } from 'react'

export default function usePreference<T>(preference: PrefKey) {
  const application = useApplication()

  const [value, setValue] = useState<T>(application.getPreference(preference) as T)

  useEffect(() => {
    return application.addEventObserver(async () => {
      const latestValue = application.getPreference(preference)

      setValue(latestValue as T)
    }, ApplicationEvent.PreferencesChanged)
  }, [application, preference])

  return value
}
