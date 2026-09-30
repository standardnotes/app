import { classNames } from '@standardnotes/utils'
import { isIOS } from '@standardnotes/ui-services'
import { RefObject, useEffect, useRef } from 'react'

type Props = {
  html: string
  textareaRef: RefObject<HTMLTextAreaElement | null>
  typographyClassName: string
  syncDependency?: string
}

export function PlainEditorSearchBackdrop({ html, textareaRef, typographyClassName, syncDependency }: Props) {
  const backdropScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    const backdrop = backdropScrollRef.current
    if (!textarea || !backdrop) {
      return
    }

    const syncScroll = () => {
      backdrop.scrollTop = textarea.scrollTop
      backdrop.scrollLeft = textarea.scrollLeft
    }

    syncScroll()
    textarea.addEventListener('scroll', syncScroll)

    return () => {
      textarea.removeEventListener('scroll', syncScroll)
    }
  }, [textareaRef, syncDependency])

  const backdropClassName = classNames(
    'plain-editor-search-backdrop font-editor whitespace-pre-wrap break-words',
    typographyClassName,
    isIOS() && '!pb-12',
  )

  return (
    <div
      ref={backdropScrollRef}
      className="plain-editor-search-backdrop-scroll pointer-events-none absolute inset-0"
      aria-hidden
    >
      <div className={backdropClassName} dir="auto" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
