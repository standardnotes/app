import { useApplication } from '@/Components/ApplicationProvider'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { ApplicationEvent, PrefKey, PrefValue } from '@standardnotes/snjs'
import { useEffect, useState } from 'react'

export default function usePreference<Key extends PrefKey, Value extends PrefValue[Key]>(preference: Key) {
  const application = useApplication()

  const [value, setValue] = useState<Value>(application.getPreference(preference, PrefDefaults[preference]) as Value)

  useEffect(() => {
    return application.addEventObserver(async () => {
      const latestValue = application.getPreference(preference, PrefDefaults[preference])

      setValue(latestValue as Value)
    }, ApplicationEvent.PreferencesChanged)
  }, [application, preference])

  return value
}
