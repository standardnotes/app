import type { Toast as ToastPropType } from './types'
import { CheckCircleFilledIcon, ClearCircleFilledIcon, InfoIcon } from '@standardnotes/icons'
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
      return 'bg-success text-info-contrast md:text-success'
    case ToastType.Error:
      return 'bg-danger text-info-contrast md:text-danger'
    default:
      return 'bg-info text-info-contrast md:text-info'
  }
}

const iconForToastType = (type: ToastType) => {
  switch (type) {
    case ToastType.Success:
      return <CheckCircleFilledIcon className="text-success h-5 w-5" />
    case ToastType.Error:
      return <ClearCircleFilledIcon className="text-danger h-5 w-5" />
    case ToastType.Progress:
    case ToastType.Loading:
      return <div className="border-info h-4 w-4 animate-spin rounded-full border border-solid border-r-transparent" />
    default:
      return <InfoIcon className="fill-text h-5 w-5" />
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
      className={`bg-passive-5 animation-fill-forwards relative mt-3 flex min-w-full select-none flex-col rounded opacity-0 md:min-w-max ${currentAnimation}`}
      style={{
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.16)',
        transition: shouldReduceMotion ? undefined : 'all 0.2s ease',
        animationDelay: !toast.dismissed ? '50ms' : undefined,
      }}
      onClick={() => {
        if (toast.type !== ToastType.Loading && toast.type !== ToastType.Progress) {
          dismissToast(toast.id)
        }
      }}
      ref={ref}
    >
      <div className="grid gap-x-2.5 gap-y-1 overflow-hidden grid-cols-[min-content,auto] pl-3 pr-3.5 py-2.5">
        {icon ? <div className="sn-icon flex items-center justify-center">{icon}</div> : null}
        {toast.title && <div className="text-text text-sm font-semibold col-start-2">{toast.title}</div>}
        <div className="text-text text-sm [word-wrap:anywhere] col-start-2">{toast.message}</div>
        {hasActions && (
          <div className="col-start-2 -mx-1.5 -mb-0.5">
            {toast.actions?.map((action, index) => (
              <button
                className={`hover:bg-passive-3 cursor-pointer rounded border-0 px-[0.45rem] py-1 text-sm font-semibold md:bg-transparent ${colorForToastType(
                  toast.type,
                )} ${index !== 0 ? 'ml-2' : ''}`}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
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
