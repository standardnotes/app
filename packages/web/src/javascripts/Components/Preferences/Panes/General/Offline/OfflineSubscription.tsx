import React, { FunctionComponent, useEffect, useState } from 'react'
import { Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/WebApplication'
import { observer } from 'mobx-react-lite'
import { STRING_REMOVE_OFFLINE_KEY_CONFIRMATION } from '@/Constants/Strings'
import { ButtonType, ClientDisplayableError } from '@standardnotes/snjs'

type Props = {
  application: WebApplication
  onSuccess?: () => void
}

const OfflineSubscription: FunctionComponent<Props> = ({ application, onSuccess }) => {
  const [activationCode, setActivationCode] = useState('')
  const [isSuccessfullyActivated, setIsSuccessfullyActivated] = useState(false)
  const [isSuccessfullyRemoved, setIsSuccessfullyRemoved] = useState(false)
  const [hasUserPreviouslyStoredCode, setHasUserPreviouslyStoredCode] = useState(false)

  useEffect(() => {
    if (application.features.hasOfflineRepo()) {
      setHasUserPreviouslyStoredCode(true)
    }
  }, [application])

  const shouldShowOfflineSubscription = () => {
    return (
      !application.hasAccount() || !application.sessions.isSignedIntoFirstPartyServer() || hasUserPreviouslyStoredCode
    )
  }

  const handleSubscriptionCodeSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const homeServer = application.homeServer

    const homeServerEnabled = homeServer && (await homeServer.isHomeServerEnabled())
    const homeServerIsRunning = homeServerEnabled && (await homeServer.isHomeServerRunning())

    if (homeServerEnabled) {
      if (!homeServerIsRunning) {
        await application.alerts.alert('Please start your home server before activating offline features.')

        return
      }

      const signedInUser = application.sessions.getUser()
      if (!signedInUser) {
        return
      }

      const parsedOfflineFeaturesCodeResult = application.features.parseOfflineEntitlementsCode(activationCode)
      if (parsedOfflineFeaturesCodeResult instanceof ClientDisplayableError) {
        await application.alerts.alert(parsedOfflineFeaturesCodeResult.text)

        return
      }

      const serverActivationResult = await homeServer.activatePremiumFeatures(
        signedInUser.email,
        parsedOfflineFeaturesCodeResult.subscriptionId,
      )
      if (serverActivationResult.isFailed()) {
        await application.alerts.alert(serverActivationResult.getError())

        return
      }
    }

    const result = await application.features.setOfflineFeaturesCode(activationCode)

    if (result instanceof ClientDisplayableError) {
      await application.alerts.alert(result.text)

      return
    }

    setIsSuccessfullyActivated(true)
    setHasUserPreviouslyStoredCode(true)
    setIsSuccessfullyRemoved(false)
    if (onSuccess) {
      onSuccess()
    }
  }

  const handleRemoveOfflineKey = async () => {
    await application.features.deleteOfflineFeatureRepo()

    setIsSuccessfullyActivated(false)
    setHasUserPreviouslyStoredCode(false)
    setActivationCode('')
    setIsSuccessfullyRemoved(true)
  }

  const handleRemoveClick = async () => {
    application.alerts
      .confirm(
        STRING_REMOVE_OFFLINE_KEY_CONFIRMATION,
        'Remove offline key?',
        'Remove Offline Key',
        ButtonType.Danger,
        'Cancel',
      )
      .then(async (shouldRemove: boolean) => {
        if (shouldRemove) {
          await handleRemoveOfflineKey()
        }
      })
      .catch((err: string) => {
        application.alerts.alert(err).catch(console.error)
      })
  }

  if (!shouldShowOfflineSubscription()) {
    return null
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="mt-3 flex w-full flex-col">
          <div className="flex flex-row items-center justify-between">
            <Subtitle>{!hasUserPreviouslyStoredCode && 'Activate'} Offline Subscription</Subtitle>
            <a
              href="https://standardnotes.com/help/59/can-i-use-standard-notes-totally-offline"
              target="_blank"
              rel="noreferrer"
              className="text-info"
            >
              Learn more
            </a>
          </div>
          <form onSubmit={handleSubscriptionCodeSubmit}>
            <div className={'mt-2'}>
              {!hasUserPreviouslyStoredCode && (
                <DecoratedInput
                  onChange={(code) => setActivationCode(code)}
                  placeholder={'Offline Subscription Code'}
                  value={activationCode}
                  disabled={isSuccessfullyActivated}
                  className={{ container: 'mb-3' }}
                />
              )}
            </div>
            {(isSuccessfullyActivated || isSuccessfullyRemoved) && (
              <div className={'info mb-3 mt-3'}>
                Your offline subscription code has been successfully {isSuccessfullyActivated ? 'activated' : 'removed'}
                .
              </div>
            )}
            {hasUserPreviouslyStoredCode && (
              <Button
                colorStyle="danger"
                label="Remove offline key"
                onClick={() => {
                  handleRemoveClick().catch(console.error)
                }}
              />
            )}
            {!hasUserPreviouslyStoredCode && !isSuccessfullyActivated && (
              <Button
                hidden={activationCode.length === 0}
                label={'Submit'}
                primary
                disabled={activationCode === ''}
                onClick={(event) => handleSubscriptionCodeSubmit(event)}
              />
            )}
          </form>
        </div>
      </div>
    </>
  )
}

export default observer(OfflineSubscription)
