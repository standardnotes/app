import { useDisableBodyScrollOnMobile } from '@/Hooks/useDisableBodyScrollOnMobile'
import { classNames } from '@standardnotes/snjs'
import { ReactNode, useCallback, useEffect, useLayoutEffect, useState } from 'react'
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
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)

  const [isMounted, setIsMounted] = useState(() => open)
  useEffect(() => {
    if (open) {
      setIsMounted(open)
    }
  }, [open])

  useEffect(() => {
    const node = popoverElement

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
  }, [open, popoverElement])

  useDisableBodyScrollOnMobile()

  const correctInitialScrollForOverflowedContent = useCallback(() => {
    const element = popoverElement
    if (element) {
      setTimeout(() => {
        element.scrollTop = 0
      }, 10)
    }
  }, [popoverElement])

  useLayoutEffect(() => {
    correctInitialScrollForOverflowedContent()
  }, [popoverElement, correctInitialScrollForOverflowedContent])

  if (!isMounted) {
    return null
  }

  return (
    <Portal>
      <div
        ref={setPopoverElement}
        className="absolute top-0 left-0 z-modal flex h-full w-full origin-bottom flex-col bg-default opacity-0"
      >
        <div className="flex items-center justify-between border-b border-border py-2.5 px-3 text-base">
          <div />
          <div className="font-semibold">{title}</div>
          <button className="font-semibold" onClick={requestClose}>
            Done
          </button>
        </div>
        <div className={classNames('h-full overflow-y-auto', className)}>{children}</div>
      </div>
    </Portal>
  )
}

export default MobilePopoverContent
