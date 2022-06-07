import type { Toast as ToastPropType } from './types'
import { CheckCircleFilledIcon, ClearCircleFilledIcon } from '@standardnotes/icons'
import { dismissToast } from './toastStore'
import { ToastType } from './enums'
import { forwardRef, RefObject, useEffect } from 'react'

const prefersReducedMotion = () => {
  const mediaQuery = matchMedia('(prefers-reduced-motion: reduce)')
  return mediaQuery.matches
}

const colorForToastType = (type: ToastType) => {
  switch (type) {
    case ToastType.Success:
      return 'color-success'
    case ToastType.Error:
      return 'color-danger'
    default:
      return 'color-info'
  }
}

const iconForToastType = (type: ToastType) => {
  switch (type) {
    case ToastType.Success:
      return <CheckCircleFilledIcon className={colorForToastType(type)} />
    case ToastType.Error:
      return <ClearCircleFilledIcon className={colorForToastType(type)} />
    case ToastType.Progress:
    case ToastType.Loading:
      return <div className="sk-spinner w-4 h-4 spinner-info" />
    default:
      return null
  }
}

type Props = {
  toast: ToastPropType
  index: number
}

export const Toast = forwardRef(({ toast, index }: Props, ref: RefObject<HTMLDivElement>) => {
  const icon = iconForToastType(toast.type)
  const hasActions = toast.actions?.length > 0
  const hasProgress = toast.type === ToastType.Progress && toast.progress > -1

  const shouldReduceMotion = prefersReducedMotion()
  const enterAnimation = shouldReduceMotion ? 'fade-in-animation' : 'slide-in-right-animation'
  const exitAnimation = shouldReduceMotion ? 'fade-out-animation' : 'slide-out-left-animation'
  const currentAnimation = toast.dismissed ? exitAnimation : enterAnimation

  useEffect(() => {
    if (ref.current && toast.dismissed) {
      const { scrollHeight, style } = ref.current

      requestAnimationFrame(() => {
        style.minHeight = 'initial'
        style.height = scrollHeight + 'px'
        style.transition = 'all 200ms'

        requestAnimationFrame(() => {
          style.height = '0'
          style.padding = '0'
          style.margin = '0'
        })
      })
    }
  }, [ref, toast.dismissed])

  return (
    <div
      data-index={index}
      role="status"
      className={`flex flex-col bg-passive-5 rounded opacity-0 animation-fill-forwards select-none min-w-max relative mt-3 ${currentAnimation}`}
      style={{
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.16)',
        transition: shouldReduceMotion ? undefined : 'all 0.2s ease',
        animationDelay: !toast.dismissed ? '50ms' : null,
      }}
      onClick={() => {
        if (!hasActions && toast.type !== ToastType.Loading && toast.type !== ToastType.Progress) {
          dismissToast(toast.id)
        }
      }}
      ref={ref}
    >
      <div className={`flex items-center w-full ${hasActions ? 'p-2 pl-3' : hasProgress ? 'px-3 py-2.5' : 'p-3'}`}>
        {icon ? <div className="flex flex-shrink-0 items-center justify-center sn-icon mr-2">{icon}</div> : null}
        <div className="text-sm">{toast.message}</div>
        {hasActions && (
          <div className="ml-4">
            {toast.actions.map((action, index) => (
              <button
                style={{
                  paddingLeft: '0.45rem',
                  paddingRight: '0.45rem',
                }}
                className={`py-1 border-0 bg-transparent cursor-pointer font-semibold text-sm hover:bg-passive-3 rounded ${colorForToastType(
                  toast.type,
                )} ${index !== 0 ? 'ml-2' : ''}`}
                onClick={() => {
                  action.handler(toast.id)
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {hasProgress && (
        <div className="toast-progress-bar">
          <div
            className="toast-progress-bar__value"
            role="progressbar"
            style={{
              width: `${toast.progress}%`,
              ...(toast.progress === 100 ? { borderTopRightRadius: 0 } : {}),
            }}
            aria-valuenow={toast.progress}
          />
        </div>
      )}
    </div>
  )
})
