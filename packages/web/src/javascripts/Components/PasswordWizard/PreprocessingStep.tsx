import Spinner from '../Spinner/Spinner'
import { useApplication } from '../ApplicationProvider'
import { useCallback, useEffect, useState } from 'react'

export const PreprocessingStep = ({
  onContinue,
  setContinueEnabled,
}: {
  onContinue: () => void
  setContinueEnabled: (disabled: boolean) => void
}) => {
  const application = useApplication()

  const [isProcessingSync, setIsProcessingSync] = useState<boolean>(true)
  const [isProcessingMessages, setIsProcessingMessages] = useState<boolean>(true)
  const [isProcessingInvites, setIsProcessingInvites] = useState<boolean>(true)
  const [needsUserConfirmation, setNeedsUserConfirmation] = useState<'yes' | 'no'>()

  const continueIfPossible = useCallback(() => {
    if (isProcessingMessages || isProcessingInvites || isProcessingSync) {
      setContinueEnabled(false)
      return
    }

    if (needsUserConfirmation === 'yes') {
      setContinueEnabled(true)
      return
    }

    onContinue()
  }, [
    isProcessingInvites,
    isProcessingMessages,
    isProcessingSync,
    needsUserConfirmation,
    onContinue,
    setContinueEnabled,
  ])

  useEffect(() => {
    continueIfPossible()
  }, [isProcessingInvites, isProcessingMessages, isProcessingSync, continueIfPossible])

  useEffect(() => {
    const processPendingSync = async () => {
      await application.sync.sync()
      setIsProcessingSync(false)
    }

    void processPendingSync()
  }, [application.sync])

  useEffect(() => {
    const processPendingMessages = async () => {
      await application.asymmetric.downloadAndProcessInboundMessages()
      setIsProcessingMessages(false)
    }

    void processPendingMessages()
  }, [application.asymmetric])

  useEffect(() => {
    const processPendingInvites = async () => {
      await application.vaultInvites.downloadInboundInvites()
      const hasPendingInvites = application.vaultInvites.getCachedPendingInviteRecords().length > 0
      setNeedsUserConfirmation(hasPendingInvites ? 'yes' : 'no')
      setIsProcessingInvites(false)
    }

    void processPendingInvites()
  }, [application])

  const isProcessing = isProcessingSync || isProcessingMessages || isProcessingInvites

  if (isProcessing) {
    return (
      <div className="flex flex-row items-center gap-3">
        <Spinner className="h-3 w-3" />
        <p className="">Checking for data conflicts...</p>
      </div>
    )
  }

  if (needsUserConfirmation === 'no') {
    return null
  }

  return (
    <div className="flex flex-col">
      <p>
        You have pending vault invites. Changing your password will delete these invites. It is recommended you accept
        or decline these invites before changing your password. If you choose to continue, these invites will be
        deleted.
      </p>
    </div>
  )
}
