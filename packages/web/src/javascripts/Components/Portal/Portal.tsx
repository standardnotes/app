import { ReactNode, useState, useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  children: ReactNode
  disabled?: boolean
}

const Portal = ({ children, disabled = false }: Props) => {
  const [container, setContainer] = useState<HTMLElement>()
  const id = 'portal/' + useId()

  useEffect(() => {
    const container = document.createElement('div')
    container.id = id
    document.body.append(container)
    setContainer(container)
    return () => container.remove()
  }, [id])

  if (disabled) {
    return <>{children}</>
  }

  return container ? createPortal(children, container) : null
}

export default Portal
