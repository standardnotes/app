/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '@/Components/Icon/Icon'
import { KeyboardKey } from '@standardnotes/ui-services'

function PortalImpl({
  onClose,
  children,
  title,
  closeOnClickOutside,
}: {
  children: ReactNode
  closeOnClickOutside: boolean
  onClose: () => void
  title: string
}) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (modalRef.current !== null) {
      modalRef.current.focus()
    }
  }, [])

  useEffect(() => {
    let modalOverlayElement: HTMLElement | null = null

    const keydownHandler = (event: KeyboardEvent) => {
      if (event.key === KeyboardKey.Escape) {
        onClose()
      }
    }

    const clickOutsideHandler = (event: MouseEvent) => {
      const target = event.target
      if (modalRef.current !== null && !modalRef.current.contains(target as Node) && closeOnClickOutside) {
        onClose()
      }
    }

    if (modalRef.current !== null) {
      modalOverlayElement = modalRef.current.parentElement
      if (modalOverlayElement !== null) {
        modalOverlayElement.addEventListener('click', clickOutsideHandler)
      }
    }

    window.addEventListener('keydown', keydownHandler)

    return () => {
      window.removeEventListener('keydown', keydownHandler)
      if (modalOverlayElement !== null) {
        modalOverlayElement.removeEventListener('click', clickOutsideHandler)
      }
    }
  }, [closeOnClickOutside, onClose])

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(0,0,0,0.65)]" role="dialog">
      <div
        className="relative flex min-w-[min(80vw,_20rem)] flex-col rounded border border-border bg-default"
        tabIndex={-1}
        ref={modalRef}
      >
        <div className="flex items-center justify-between border-b border-border px-3.5 py-2">
          <div className="text-sm font-semibold">{title}</div>
          <button tabIndex={0} className="ml-2 rounded p-1 font-bold hover:bg-contrast" onClick={onClose}>
            <Icon type="close" />
          </button>
        </div>
        <div className="px-3.5 py-3">{children}</div>
      </div>
    </div>
  )
}

export default function Modal({
  onClose,
  children,
  title,
  closeOnClickOutside = true,
}: {
  children: ReactNode
  closeOnClickOutside?: boolean
  onClose: () => void
  title: string
}): ReactNode {
  const [containerElement, setContainerElement] = useState<HTMLElement | undefined>()
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    setContainerElement(editor.getRootElement()?.parentElement ?? document.body)
  }, [editor])

  if (!containerElement) {
    return null
  }

  return createPortal(
    <PortalImpl onClose={onClose} title={title} closeOnClickOutside={closeOnClickOutside}>
      {children}
    </PortalImpl>,
    containerElement,
  )
}
