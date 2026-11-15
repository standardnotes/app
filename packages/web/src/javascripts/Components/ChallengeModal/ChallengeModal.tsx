import { WebApplication } from '@/Application/WebApplication'
import { c } from 'ttag'
import { ButtonType, Challenge, ChallengeReason } from '@standardnotes/snjs'
import { ProtectedIllustration } from '@standardnotes/icons'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import LockscreenWorkspaceSwitcher from './LockscreenWorkspaceSwitcher'
import { WebApplicationGroup } from '@/Application/WebApplicationGroup'
import { classNames } from '@standardnotes/utils'
import ModalOverlay from '../Modal/ModalOverlay'
import Modal from '../Modal/Modal'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useAutoElementRect } from '@/Hooks/useElementRect'
import ChallengeForm from './ChallengeForm'

type Props = {
  application: WebApplication
  mainApplicationGroup: WebApplicationGroup
  challenge: Challenge
  onDismiss?: (challenge: Challenge) => void
}

const ChallengeModal: FunctionComponent<Props> = ({ application, mainApplicationGroup, challenge, onDismiss }) => {
  const shouldShowForgotPasscode = [ChallengeReason.ApplicationUnlock, ChallengeReason.Migration].includes(
    challenge.reason,
  )

  const shouldShowWorkspaceSwitcher = challenge.reason === ChallengeReason.ApplicationUnlock

  const cancelChallenge = useCallback(() => {
    if (challenge.cancelable) {
      application.cancelChallenge(challenge)
      onDismiss?.(challenge)
    }
  }, [application, challenge, onDismiss])

  useEffect(() => {
    const removeListener = application.addAndroidBackHandlerEventListener(() => {
      if (challenge.cancelable) {
        cancelChallenge()
      }
      return true
    })
    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [application, cancelChallenge, challenge.cancelable])

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)
  const isFullScreenBlocker = challenge.reason === ChallengeReason.ApplicationUnlock

  const [modalElement, setModalElement] = useState<HTMLDivElement | null>(null)
  const modalElementRect = useAutoElementRect(modalElement, {
    updateOnWindowResize: true,
  })

  return (
    <ModalOverlay
      isOpen={true}
      key={challenge.id}
      ref={setModalElement}
      close={cancelChallenge}
      hideOnInteractOutside={false}
      backdropClassName={isFullScreenBlocker ? 'bg-passive-5' : ''}
      className={classNames(
        'sn-component challenge-modal relative m-0 flex h-full w-full flex-col items-center rounded border-solid border-border bg-default p-0 md:h-auto md:!w-max',
        !isMobileScreen && 'shadow-overlay-light',
      )}
    >
      <Modal
        title={c('B5.SecuritySync.Challenge.Title').t`Authenticate`}
        close={cancelChallenge}
        customHeader={<></>}
        customFooter={<></>}
        disableCustomHeader={isMobileScreen}
        actions={[
          {
            label: c('B5.SecuritySync.Challenge.Label').t`Cancel`,
            onClick: cancelChallenge,
            type: 'primary',
            hidden: !challenge.cancelable,
            mobileSlot: 'right',
          },
        ]}
      >
        {challenge.cancelable && (
          <button
            onClick={cancelChallenge}
            aria-label={c('B2.NavSharedUI.AriaLabel').t`Close modal`}
            className="absolute right-4 top-4 hidden cursor-pointer border-0 bg-transparent p-1 md:flex"
          >
            <Icon type="close" className="text-neutral" />
          </button>
        )}
        <div className="flex min-h-0 w-full flex-grow flex-col items-center overflow-auto p-8">
          <ProtectedIllustration
            className={classNames(
              'mb-4 h-30 w-30 flex-shrink-0',
              modalElementRect && modalElementRect.height < 500 ? 'hidden md:block' : '',
            )}
          />
          <div className="mb-3 max-w-76 text-center text-lg font-bold">{challenge.heading}</div>
          {challenge.subheading && (
            <div className="break-word mb-4 max-w-76 text-center text-sm">{challenge.subheading}</div>
          )}
          <ChallengeForm application={application} challenge={challenge} onDismiss={onDismiss} />
          {shouldShowForgotPasscode && (
            <Button
              className="flex min-w-76 items-center justify-center"
              onClick={() => {
                application.alerts
                  .confirm(
                    c('B5.SecuritySync.Passcode.Info')
                      .t`If you forgot your local passcode, your only option is to clear your local data from this device and sign back in to your account.`,
                    c('B5.SecuritySync.Passcode.Title').t`Forgot passcode?`,
                    c('B5.SecuritySync.Passcode.Action').t`Delete local data`,
                    ButtonType.Danger,
                  )
                  .then((shouldDeleteLocalData) => {
                    if (shouldDeleteLocalData) {
                      application.user.signOut().catch(console.error)
                    }
                  })
                  .catch(console.error)
              }}
            >
              <Icon type="help" className="mr-2 text-neutral" />
              {c('B5.SecuritySync.Passcode.Title').t`Forgot passcode?`}
            </Button>
          )}
          {shouldShowWorkspaceSwitcher && <LockscreenWorkspaceSwitcher mainApplicationGroup={mainApplicationGroup} />}
        </div>
      </Modal>
    </ModalOverlay>
  )
}

export default ChallengeModal
