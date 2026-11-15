import { Challenge, ChallengeReason } from '@standardnotes/snjs'
import { createContext, MutableRefObject, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react'
import { useApplication } from '../ApplicationProvider'

/** Returns true if it takes over displaying the challenge. */
export type InlineChallengeHandler = (challenge: Challenge) => boolean

/**
 * Holds the handler that is offered each new challenge before it is shown in the challenge modal.
 * Provided by ApplicationView.
 */
export const InlineChallengeHandlerContext = createContext<
  MutableRefObject<InlineChallengeHandler | undefined> | undefined
>(undefined)

/**
 * Runs `authorize` and takes over the challenge it raises, if that challenge has the given reason,
 * so the caller can show it in place with `ChallengeForm`. Does nothing if `reason` is undefined.
 * If the challenge is dismissed without success, `retry` starts again. Unmounting cancels a pending challenge.
 */
export const useInlineChallenge = (
  reason: ChallengeReason | undefined,
  authorize: () => Promise<unknown>,
): { challenge: Challenge | undefined; onDismiss: () => void; retry: () => void } => {
  const application = useApplication()
  const handlerRef = useContext(InlineChallengeHandlerContext)
  const [challenge, setChallenge] = useState<Challenge>()
  const [attempt, setAttempt] = useState(0)
  const pendingChallengeRef = useRef<Challenge>()

  /** A layout effect, so a challenge raised synchronously by `authorize` is shown before the first paint. */
  useLayoutEffect(() => {
    if (reason === undefined || !handlerRef) {
      return
    }

    const handler: InlineChallengeHandler = (incoming) => {
      if (handlerRef.current !== handler || incoming.reason !== reason) {
        return false
      }
      handlerRef.current = undefined
      pendingChallengeRef.current = incoming
      setChallenge(incoming)
      return true
    }
    const stopListening = () => {
      if (handlerRef.current === handler) {
        handlerRef.current = undefined
      }
    }

    handlerRef.current = handler
    authorize().catch(console.error).finally(stopListening)

    return () => {
      stopListening()
      if (pendingChallengeRef.current) {
        application.cancelChallenge(pendingChallengeRef.current)
        pendingChallengeRef.current = undefined
      }
      setChallenge(undefined)
    }
  }, [application, handlerRef, reason, authorize, attempt])

  const onDismiss = useCallback(() => {
    pendingChallengeRef.current = undefined
    setChallenge(undefined)
  }, [])

  const retry = useCallback(() => setAttempt((attempt) => attempt + 1), [])

  return { challenge, onDismiss, retry }
}
