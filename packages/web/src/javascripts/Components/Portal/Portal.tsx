import { ReactNode, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  children: ReactNode
}

// Use better random id implementation
const randomPortalId = () => Math.random() * 69 + 420

const Portal = ({ children }: Props) => {
  const [container, setContainer] = useState<HTMLElement>()

  useEffect(() => {
    const container = document.createElement('div')
    container.id = `react-portal-${randomPortalId()}`
    document.body.append(container)
    setContainer(container)
    return () => container.remove()
  }, [])

  return container ? createPortal(children, container) : null
}

export default Portal
