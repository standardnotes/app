import { WebApplication } from '@/Application/WebApplication'
import { FunctionComponent, useCallback, useState, useEffect } from 'react'
import { ApplicationEvent } from '@standardnotes/snjs'
import { isSameDay } from '@/Utils'
import Button from '@/Components/Button/Button'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { Title, Text } from '../../PreferencesComponents/Content'

type Props = {
  application: WebApplication
}

const Protections: FunctionComponent<Props> = ({ application }) => {
  const enableProtections = () => {
    application.clearProtectionSession().catch(console.error)
  }

  const [hasProtections, setHasProtections] = useState(() => application.hasProtectionSources())

  const getProtectionsDisabledUntil = useCallback((): string | null => {
    const protectionExpiry = application.getProtectionSessionExpiryDate()
    const now = new Date()
    if (protectionExpiry > now) {
      let f: Intl.DateTimeFormat
      if (isSameDay(protectionExpiry, now)) {
        f = new Intl.DateTimeFormat(undefined, {
          hour: 'numeric',
          minute: 'numeric',
        })
      } else {
        f = new Intl.DateTimeFormat(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: 'numeric',
        })
      }

      return f.format(protectionExpiry)
    }
    return null
  }, [application])

  const [protectionsDisabledUntil, setProtectionsDisabledUntil] = useState(getProtectionsDisabledUntil())

  useEffect(() => {
    const removeUnprotectedSessionBeginObserver = application.addEventObserver(async () => {
      setProtectionsDisabledUntil(getProtectionsDisabledUntil())
    }, ApplicationEvent.UnprotectedSessionBegan)

    const removeUnprotectedSessionEndObserver = application.addEventObserver(async () => {
      setProtectionsDisabledUntil(getProtectionsDisabledUntil())
    }, ApplicationEvent.UnprotectedSessionExpired)

    const removeKeyStatusChangedObserver = application.addEventObserver(async () => {
      setHasProtections(application.hasProtectionSources())
    }, ApplicationEvent.KeyStatusChanged)

    return () => {
      removeUnprotectedSessionBeginObserver()
      removeUnprotectedSessionEndObserver()
      removeKeyStatusChangedObserver()
    }
  }, [application, getProtectionsDisabledUntil])

  if (!hasProtections) {
    return null
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Protections</Title>
        {protectionsDisabledUntil ? (
          <Text className="text-info">Unprotected access expires at {protectionsDisabledUntil}.</Text>
        ) : (
          <Text className="text-info">Protections are enabled.</Text>
        )}
        <Text className="mt-2">
          Actions like viewing or searching protected notes, exporting decrypted backups, or revoking an active session
          require additional authentication such as entering your account password or application passcode.
        </Text>
        {protectionsDisabledUntil && (
          <Button className="mt-3" primary label="End Unprotected Access" onClick={enableProtections} />
        )}
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default Protections
