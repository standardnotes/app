import { useApplication } from '@/Components/ApplicationProvider'
import {
  ApplicationEvent,
  PrefKey,
  PrefDefaults,
  LocalPrefKey,
  LocalPrefValue,
  LocalPrefDefaults,
} from '@standardnotes/snjs'
import { useCallback, useEffect, useState } from 'react'

export function useLocalPreference<Key extends LocalPrefKey>(preference: Key) {
  const application = useApplication()

  const [value, setValue] = useState(application.preferences.getLocalValue(preference, LocalPrefDefaults[preference]))

  const setNewValue = useCallback(
    (newValue: LocalPrefValue[Key]) => {
      application.preferences.setLocalValue(preference, newValue)
    },
    [application, preference],
  )

  useEffect(() => {
    return application.addEventObserver(async () => {
      const latestValue = application.preferences.getLocalValue(preference, LocalPrefDefaults[preference])

      setValue(latestValue)
    }, ApplicationEvent.LocalPreferencesChanged)
  }, [application, preference])

  return [value, setNewValue] as const
}

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
