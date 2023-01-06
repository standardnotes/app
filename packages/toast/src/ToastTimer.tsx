import { useCallback, useEffect, useRef, FunctionComponent } from 'react'
import { Toast } from './Toast'
import { Toast as ToastPropType } from './types'
import { ToastType } from './enums'
import { dismissToast } from './toastStore'

type Props = {
  toast: ToastPropType
  index: number
}

const getDefaultForAutoClose = (hasActions: boolean, type: ToastType) => {
  return !hasActions && ![ToastType.Loading, ToastType.Progress].includes(type)
}

const getDefaultToastDuration = (type: ToastType) => (type === ToastType.Error ? 8000 : 4000)

export const ToastTimer: FunctionComponent<Props> = ({ toast, index }) => {
  const toastElementRef = useRef<HTMLDivElement>(null)
  const toastTimerIdRef = useRef<number>()

  const hasActions = Boolean(toast.actions?.length)
  const shouldAutoClose = toast.autoClose ?? getDefaultForAutoClose(hasActions, toast.type)
  const duration = toast.duration ?? getDefaultToastDuration(toast.type)

  const startTimeRef = useRef(duration)
  const remainingTimeRef = useRef(duration)

  const dismissToastOnEnd = useCallback(() => {
    if (!shouldAutoClose) {
      return
    }

    dismissToast(toast.id)
  }, [shouldAutoClose, toast.id])

  const clearTimer = useCallback(() => {
    if (toastTimerIdRef.current) {
      clearTimeout(toastTimerIdRef.current)
    }
  }, [])

  const pauseTimer = useCallback(() => {
    clearTimer()
    remainingTimeRef.current -= Date.now() - startTimeRef.current
  }, [clearTimer])

  const resumeTimer = useCallback(() => {
    startTimeRef.current = Date.now()
    clearTimer()
    toastTimerIdRef.current = window.setTimeout(dismissToastOnEnd, remainingTimeRef.current)
  }, [clearTimer, dismissToastOnEnd])

  const handleMouseEnter = useCallback(() => {
    pauseTimer()
  }, [pauseTimer])

  const handleMouseLeave = useCallback(() => {
    resumeTimer()
  }, [resumeTimer])

  const handlePageFocus = useCallback(() => {
    resumeTimer()
  }, [resumeTimer])

  const handlePageBlur = useCallback(() => {
    pauseTimer()
  }, [pauseTimer])

  useEffect(() => {
    clearTimer()

    if (shouldAutoClose) {
      resumeTimer()
    }

    const toastElement = toastElementRef.current
    if (toastElement) {
      toastElement.addEventListener('mouseenter', handleMouseEnter)
      toastElement.addEventListener('mouseleave', handleMouseLeave)
    }
    if (toast.pauseOnWindowBlur) {
      window.addEventListener('focus', handlePageFocus)
      window.addEventListener('blur', handlePageBlur)
    }

    return () => {
      clearTimer()
      if (toastElement) {
        toastElement.removeEventListener('mouseenter', handleMouseEnter)
        toastElement.removeEventListener('mouseleave', handleMouseLeave)
      }
      if (toast.pauseOnWindowBlur) {
        window.removeEventListener('focus', handlePageFocus)
        window.removeEventListener('blur', handlePageBlur)
      }
    }
  }, [
    clearTimer,
    dismissToastOnEnd,
    duration,
    handleMouseEnter,
    handleMouseLeave,
    handlePageBlur,
    handlePageFocus,
    resumeTimer,
    shouldAutoClose,
    toast.id,
  ])

  return <Toast toast={toast} index={index} ref={toastElementRef} />
}
