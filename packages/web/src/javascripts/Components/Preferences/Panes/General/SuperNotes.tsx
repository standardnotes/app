import { AutoDownloadLimit, LocalPrefKey, PrefKey } from '@standardnotes/snjs'
import { useMediaQuery, MutuallyExclusiveMediaQueryBreakpoints } from '../../../../Hooks/useMediaQuery'
import usePreference, { useLocalPreference } from '../../../../Hooks/usePreference'
import Switch from '../../../Switch/Switch'
import { Subtitle, Title, Text } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { WebApplication } from '../../../../Application/WebApplication'
import HorizontalSeparator from '../../../Shared/HorizontalSeparator'
import Dropdown from '../../../Dropdown/Dropdown'
import { useMemo } from 'react'
import { ElementIds } from '@/Constants/ElementIDs'

const SuperNotes = ({ application }: { application: WebApplication }) => {
  const isMobile = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const alwaysShowSuperToolbar = usePreference(PrefKey.AlwaysShowSuperToolbar)

  const [alwaysAutoDownloadEmbeds, setAlwaysAutoDownloadEmbeds] = useLocalPreference(
    LocalPrefKey.AlwaysAutoDownloadSuperEmbeds,
  )
  const [autoDownloadLimit, setAutoDownloadLimit] = useLocalPreference(LocalPrefKey.SuperEmbedAutoDownloadLimit)

  const autoDownloadLimitOptions = useMemo(
    () => [
      {
        label: '2.5 MB',
        value: 'TwoAndHalfMB',
      },
      {
        label: '5 MB',
        value: 'FiveMB',
      },
      {
        label: '10 MB',
        value: 'TenMB',
      },
      {
        label: '20 MB',
        value: 'TwentyMB',
      },
      {
        label: '50 MB',
        value: 'FiftyMB',
      },
    ],
    [],
  )

  const dropdownValue: keyof typeof AutoDownloadLimit = useMemo(() => {
    switch (autoDownloadLimit) {
      case AutoDownloadLimit.TwoAndHalfMB:
        return 'TwoAndHalfMB'
      case AutoDownloadLimit.FiveMB:
        return 'FiveMB'
      case AutoDownloadLimit.TenMB:
        return 'TenMB'
      case AutoDownloadLimit.TwentyMB:
        return 'TwentyMB'
      case AutoDownloadLimit.FiftyMB:
        return 'FiftyMB'
    }
  }, [autoDownloadLimit])

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title className="mb-2">Super notes</Title>
        {!isMobile && (
          <>
            <div className="flex justify-between gap-2 md:items-center">
              <div className="flex flex-col">
                <Subtitle>Use always-visible toolbar in Super notes</Subtitle>
                <Text>
                  When enabled, the Super toolbar will always be shown at the top of the note. It can be temporarily
                  toggled using Cmd/Ctrl+Shift+K. When disabled, the Super toolbar will only be shown as a floating
                  toolbar when text is selected.
                </Text>
              </div>
              <Switch
                onChange={() => {
                  application
                    .setPreference(PrefKey.AlwaysShowSuperToolbar, !alwaysShowSuperToolbar)
                    .catch(console.error)
                }}
                checked={alwaysShowSuperToolbar}
              />
            </div>
            <HorizontalSeparator classes="my-4" />
          </>
        )}
        <div className="flex justify-between gap-2 md:items-center">
          <div className="flex flex-col">
            <Subtitle>Always auto-download embedded files</Subtitle>
            <Text>
              When enabled, embedded files will always be automatically downloaded regardless of their file size.
            </Text>
          </div>
          <Switch
            onChange={() => {
              setAlwaysAutoDownloadEmbeds(!alwaysAutoDownloadEmbeds)
            }}
            checked={alwaysAutoDownloadEmbeds}
          />
        </div>
        <HorizontalSeparator classes="my-4" />
        <div id={ElementIds.AutoDownloadLimitPreference}>
          <Subtitle>Auto-download limit for embedded files</Subtitle>
          <Text>Only embedded files below the set limit be automatically downloaded</Text>
          <div className="mt-2">
            <Dropdown
              label="Select the line height for plaintext notes"
              items={autoDownloadLimitOptions}
              value={dropdownValue}
              onChange={(value) => {
                setAutoDownloadLimit(AutoDownloadLimit[value as keyof typeof AutoDownloadLimit])
              }}
            />
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default SuperNotes
