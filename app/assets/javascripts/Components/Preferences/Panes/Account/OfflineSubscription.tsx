import React, { FunctionComponent, useEffect, useState } from 'react'
import { Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { STRING_REMOVE_OFFLINE_KEY_CONFIRMATION } from '@/Strings'
import { ButtonType, ClientDisplayableError } from '@standardnotes/snjs'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const OfflineSubscription: FunctionComponent<Props> = ({ application }) => {
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
    return !application.hasAccount() || application.isThirdPartyHostUsed() || hasUserPreviouslyStoredCode
  }

  const handleSubscriptionCodeSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const result = await application.features.setOfflineFeaturesCode(activationCode)

    if (result instanceof ClientDisplayableError) {
      await application.alertService.alert(result.text)
    } else {
      setIsSuccessfullyActivated(true)
      setHasUserPreviouslyStoredCode(true)
      setIsSuccessfullyRemoved(false)
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
    application.alertService
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
        application.alertService.alert(err).catch(console.error)
      })
  }

  if (!shouldShowOfflineSubscription()) {
    return null
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col mt-3 w-full">
          <Subtitle>{!hasUserPreviouslyStoredCode && 'Activate'} Offline Subscription</Subtitle>
          <form onSubmit={handleSubscriptionCodeSubmit}>
            <div className={'mt-2'}>
              {!hasUserPreviouslyStoredCode && (
                <DecoratedInput
                  onChange={(code) => setActivationCode(code)}
                  placeholder={'Offline Subscription Code'}
                  value={activationCode}
                  disabled={isSuccessfullyActivated}
                  className={'mb-3'}
                />
              )}
            </div>
            {(isSuccessfullyActivated || isSuccessfullyRemoved) && (
              <div className={'mt-3 mb-3 info'}>
                Your offline subscription code has been successfully {isSuccessfullyActivated ? 'activated' : 'removed'}
                .
              </div>
            )}
            {hasUserPreviouslyStoredCode && (
              <Button
                dangerStyle={true}
                label="Remove offline key"
                onClick={() => {
                  handleRemoveClick().catch(console.error)
                }}
              />
            )}
            {!hasUserPreviouslyStoredCode && !isSuccessfullyActivated && (
              <Button
                label={'Submit'}
                variant="primary"
                disabled={activationCode === ''}
                onClick={(event) => handleSubscriptionCodeSubmit(event)}
              />
            )}
          </form>
        </div>
      </div>
      <HorizontalSeparator classes="mt-8 mb-5" />
    </>
  )
}

export default observer(OfflineSubscription)
