import { classNames } from '@standardnotes/utils'

import Icon from '@/Components/Icon/Icon'
import { Status } from './Status'
import { ElementIds } from '@/Constants/ElementIDs'
import { useApplication } from '@/Components/ApplicationProvider'
import { HomeServerServiceInterface } from '@standardnotes/snjs'
import { useEffect, useState } from 'react'

type Props = {
  status: Status | undefined
  homeServerService: HomeServerServiceInterface
  className?: string
}

const StatusIndicator = ({ status, className, homeServerService }: Props) => {
  const application = useApplication()
  const [signInStatusMessage, setSignInStatusMessage] = useState<string>('')
  const [signInStatusIcon, setSignInStatusIcon] = useState<string>('')
  const [signInStatusClassName, setSignInStatusClassName] = useState<string>('')

  let statusClassName: string
  let icon: string

  switch (status?.state) {
    case 'online':
      statusClassName = 'bg-success text-success-contrast'
      icon = 'check'
      break
    case 'error':
      statusClassName = 'bg-danger text-danger-contrast'
      icon = 'warning'
      break
    default:
      statusClassName = 'bg-contrast'
      icon = 'sync'
      break
  }

  useEffect(() => {
    async function updateSignedInStatus() {
      const signedInUser = application.sessions.getUser()
      if (signedInUser) {
        const isUsingHomeServer = await application.isUsingHomeServer()
        if (isUsingHomeServer) {
          setSignInStatusMessage(`You are currently signed into your home server under ${signedInUser.email}`)
          setSignInStatusClassName('bg-success text-success-contrast')
          setSignInStatusIcon('check')
        } else {
          setSignInStatusMessage(
            `You are not currently signed into your home server. To use your home server, sign out of ${
              signedInUser.email
            }, then sign in or register using ${await homeServerService.getHomeServerUrl()}.`,
          )
          setSignInStatusClassName('bg-warning text-warning-contrast')
          setSignInStatusIcon('warning')
        }
      } else {
        setSignInStatusMessage(
          `You are not currently signed into your home server. To use your home server, sign in or register using ${await homeServerService.getHomeServerUrl()}`,
        )
        setSignInStatusClassName('bg-warning text-warning-contrast')
        setSignInStatusIcon('warning')
      }
    }

    void updateSignedInStatus()
  }, [application, homeServerService, setSignInStatusMessage])

  return (
    <>
      <div className="mt-2.5 flex flex-row items-center">
        <div className="note-status-tooltip-container relative">
          <div
            className={classNames(
              'peer flex h-5 w-5 items-center justify-center rounded-full',
              statusClassName,
              className,
            )}
            aria-describedby={ElementIds.NoteStatusTooltip}
          >
            <Icon className={status?.state === 'restarting' ? 'animate-spin' : ''} type={icon} size="small" />
          </div>
        </div>
        <div>
          <div className={'mr-3 font-bold'}>{status?.message}</div>
          <div className={'mr-3'}>{status?.description}</div>
        </div>
      </div>
      {status?.state !== 'restarting' && (
        <div className="mt-2.5 flex flex-row items-center">
          <div className="note-status-tooltip-container relative">
            <div
              className={classNames(
                'peer flex h-5 w-5 items-center justify-center rounded-full',
                signInStatusClassName,
                className,
              )}
              aria-describedby={ElementIds.NoteStatusTooltip}
            >
              <Icon type={signInStatusIcon} size="small" />
            </div>
          </div>
          <div>
            <div className={'mr-3'}>{signInStatusMessage}</div>
          </div>
        </div>
      )}
    </>
  )
}

export default StatusIndicator
