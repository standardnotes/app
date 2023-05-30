import { ReactNode, createContext, useContext, memo } from 'react'

import { observer } from 'mobx-react-lite'
import { WebApplication } from '@/Application/WebApplication'

const ApplicationContext = createContext<WebApplication | undefined>(undefined)

export const useApplication = () => {
  const value = useContext(ApplicationContext)

  if (!value) {
    throw new Error('Component must be a child of <ApplicationProvider />')
  }

  return value
}

type ChildrenProps = {
  children: ReactNode
}

type ProviderProps = {
  application: WebApplication
} & ChildrenProps

const MemoizedChildren = memo(({ children }: ChildrenProps) => <>{children}</>)

const ApplicationProvider = ({ application, children }: ProviderProps) => {
  return (
    <ApplicationContext.Provider value={application}>
      <MemoizedChildren children={children} />
    </ApplicationContext.Provider>
  )
}

export default observer(ApplicationProvider)
