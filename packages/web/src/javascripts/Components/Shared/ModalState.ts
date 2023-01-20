import { useEffect, useMemo, useState } from 'react'

type Action = {
  label: string
  type: 'primary' | 'secondary' | 'cancel'
  onClick: () => void
  mobileSlot?: 'left' | 'right'
  hidden?: boolean
  disabled?: boolean
}

type Config = {
  title: string
  isOpen?: boolean
  close?: () => void
  actions?: Action[]
  dismissOnOverlayClick?: boolean
}

export const useModalState = (config: Config) => {
  const [isOpen, setIsOpen] = useState(() => config.isOpen || false)
  const actions = useMemo(() => {
    if (!config.actions) {
      return []
    }

    return config.actions
      .sort((a, b) => {
        if (a.type === 'cancel') {
          return -1
        }
        if (b.type === 'cancel') {
          return 1
        }
        if (a.type === 'secondary') {
          return -1
        }
        if (b.type === 'secondary') {
          return 1
        }
        return 0
      })
      .filter((action) => !action.hidden)
  }, [config.actions])
  const close = config.close ?? (() => setIsOpen(false))
  const dismissOnOverlayClick = config.dismissOnOverlayClick ?? true

  useEffect(() => {
    if (typeof config.isOpen === 'boolean') {
      setIsOpen(config.isOpen)
    }
  }, [config.isOpen])

  return {
    title: config.title,
    isOpen,
    close,
    actions,
    dismissOnOverlayClick,
  }
}

export type ModalState = ReturnType<typeof useModalState>
