import { WebApplication } from '@/Application/Application'
import { Text, Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { PrefKey } from '@standardnotes/snjs'
import { ChangeEventHandler, useRef, useState } from 'react'
import dayjs from 'dayjs'

type Props = {
  application: WebApplication
}

const PrefChangeDebounceTimeInMs = 25

const HelpPageUrl = 'https://day.js.org/docs/en/display/format#list-of-all-available-formats'

const CustomNoteTitleFormat = ({ application }: Props) => {
  const [customNoteTitleFormat, setCustomNoteTitleFormat] = useState(() =>
    application.getPreference(PrefKey.CustomNoteTitleFormat, PrefDefaults[PrefKey.CustomNoteTitleFormat]),
  )

  const setCustomNoteTitleFormatPreference = () => {
    application.setPreference(PrefKey.CustomNoteTitleFormat, customNoteTitleFormat)
  }

  const debounceTimeoutRef = useRef<number>()

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setCustomNoteTitleFormat(event.currentTarget.value)

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = window.setTimeout(async () => {
      setCustomNoteTitleFormatPreference()
    }, PrefChangeDebounceTimeInMs)
  }

  return (
    <>
      <HorizontalSeparator classes="my-4" />
      <div>
        <Subtitle>Custom Note Title Format</Subtitle>
        <Text>
          All available date-time formatting options can be found{' '}
          <a
            className="underline"
            href={HelpPageUrl}
            target="_blank"
            onClick={(event) => {
              if (application.isNativeMobileWeb()) {
                event.preventDefault()
                application.mobileDevice().openUrl(HelpPageUrl)
              }
            }}
          >
            here
          </a>
          . Use square brackets (<code>[]</code>) to escape date-time formatting.
        </Text>
        <div className="mt-2">
          <input
            className="min-w-55 rounded border border-solid border-passive-3 bg-default px-2 py-1.5 text-sm focus-within:ring-2 focus-within:ring-info"
            placeholder="e.g. YYYY-MM-DD"
            value={customNoteTitleFormat}
            onChange={handleInputChange}
            onBlur={setCustomNoteTitleFormatPreference}
            spellCheck={false}
          />
        </div>
        <div className="mt-2">
          <span className="font-bold">Preview:</span> {dayjs().format(customNoteTitleFormat)}
        </div>
      </div>
    </>
  )
}

export default CustomNoteTitleFormat
