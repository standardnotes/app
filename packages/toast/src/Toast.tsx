import type { Toast as ToastPropType } from './types'
import { CheckCircleFilledIcon, ClearCircleFilledIcon } from '@standardnotes/icons'
import { dismissToast } from './toastStore'
import { ToastType } from './enums'
import { ForwardedRef, forwardRef, RefObject, useEffect } from 'react'

const prefersReducedMotion = () => {
  const mediaQuery = matchMedia('(prefers-reduced-motion: reduce)')
  return mediaQuery.matches
}

const colorForToastType = (type: ToastType) => {
  switch (type) {
    case ToastType.Success:
      return 'text-success'
    case ToastType.Error:
      return 'text-danger'
    default:
      return 'text-info'
  }
}

const iconForToastType = (type: ToastType) => {
  switch (type) {
    case ToastType.Success:
      return <CheckCircleFilledIcon className={`h-5 w-5 ${colorForToastType(type)}`} />
    case ToastType.Error:
      return <ClearCircleFilledIcon className={`h-5 w-5 ${colorForToastType(type)}`} />
    case ToastType.Progress:
    case ToastType.Loading:
      return <div className="border-info h-4 w-4 animate-spin rounded-full border border-solid border-r-transparent" />
    default:
      return null
  }
}

type Props = {
  toast: ToastPropType
  index: number
}

export const Toast = forwardRef(({ toast, index }: Props, ref: ForwardedRef<HTMLDivElement>) => {
  const icon = iconForToastType(toast.type)
  const hasActions = toast.actions && toast.actions.length > 0
  const hasProgress = toast.type === ToastType.Progress && toast.progress !== undefined && toast.progress > -1

  const shouldReduceMotion = prefersReducedMotion()
  const enterAnimation = shouldReduceMotion ? 'fade-in-animation' : 'slide-in-right-animation'
  const exitAnimation = shouldReduceMotion ? 'fade-out-animation' : 'slide-out-left-animation'
  const currentAnimation = toast.dismissed ? exitAnimation : enterAnimation

  useEffect(() => {
    if (!ref) {
      return
    }

    const element = (ref as RefObject<HTMLDivElement>).current

    if (element && toast.dismissed) {
      const { scrollHeight, style } = element

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
      className={`bg-passive-5 animation-fill-forwards relative mt-3 flex min-w-max select-none flex-col rounded opacity-0 ${currentAnimation}`}
      style={{
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.16)',
        transition: shouldReduceMotion ? undefined : 'all 0.2s ease',
        animationDelay: !toast.dismissed ? '50ms' : undefined,
      }}
      onClick={() => {
        if (!hasActions && toast.type !== ToastType.Loading && toast.type !== ToastType.Progress) {
          dismissToast(toast.id)
        }
      }}
      ref={ref}
    >
      <div className={`flex w-full items-center ${hasActions ? 'p-2 pl-3' : hasProgress ? 'px-3 py-2.5' : 'p-3'}`}>
        {icon ? <div className="sn-icon mr-2 flex flex-shrink-0 items-center justify-center">{icon}</div> : null}
        <div className="text-text text-sm">{toast.message}</div>
        {hasActions && (
          <div className="ml-4">
            {toast.actions?.map((action, index) => (
              <button
                style={{
                  paddingLeft: '0.45rem',
                  paddingRight: '0.45rem',
                }}
                className={`hover:bg-passive-3 cursor-pointer rounded border-0 bg-transparent py-1 text-sm font-semibold ${colorForToastType(
                  toast.type,
                )} ${index !== 0 ? 'ml-2' : ''}`}
                onClick={() => {
                  action.handler(toast.id)
                }}
                key={index}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {hasProgress && (
        <div className="bg-default w-full overflow-hidden rounded rounded-tl-none rounded-tr-none">
          <div
            className="bg-info h-2 rounded rounded-tl-none transition-[width] duration-100"
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
