import { ReactNode, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  children: ReactNode
}

const randomPortalId = () => Math.random()

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
