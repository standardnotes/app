import { classNames } from '@standardnotes/snjs'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import Portal from '../Portal/Portal'

const MobilePopoverContent = ({
  open,
  requestClose,
  children,
  title,
  className,
}: {
  open: boolean
  requestClose: () => void
  children: ReactNode
  title: string
  className?: string
}) => {
  const [isMounted, setIsMounted] = useState(() => open)
  useEffect(() => {
    if (open) {
      setIsMounted(open)
    }
  }, [open])

  const animationCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) {
        return
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (prefersReducedMotion) {
        return
      }

      if (open) {
        node.animate(
          [
            {
              opacity: 0,
              transform: 'scaleY(0)',
            },
            {
              opacity: 1,
              transform: 'scaleY(1)',
            },
          ],
          {
            easing: 'ease-in-out',
            duration: 150,
            fill: 'forwards',
          },
        )
      } else {
        const animation = node.animate(
          [
            {
              opacity: 1,
              transform: 'scaleY(1)',
            },
            {
              opacity: 0,
              transform: 'scaleY(0)',
            },
          ],
          {
            easing: 'ease-in-out',
            duration: 150,
            fill: 'forwards',
          },
        )
        animation.finished
          .then(() => {
            setIsMounted(false)
          })
          .catch(console.error)
      }
    },
    [open],
  )

  if (!isMounted) {
    return null
  }

  return (
    <Portal>
      <div
        ref={animationCallbackRef}
        className={classNames('absolute top-0 left-0 z-modal h-full w-full origin-bottom bg-default opacity-0')}
      >
        <div className="flex items-center justify-between border-b border-border py-2.5 px-3 text-base">
          <div />
          <div className="font-semibold">{title}</div>
          <button className="font-semibold" onClick={requestClose}>
            Done
          </button>
        </div>
        <div className={className}>{children}</div>
      </div>
    </Portal>
  )
}

export default MobilePopoverContent
