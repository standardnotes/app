import { WebApplication } from '@/Application/Application'
import { observer } from 'mobx-react-lite'
import { createContext, memo, ReactNode, useContext } from 'react'

type BackHandlerContextData = WebApplication['addBackHandlerEventListener']

const BackHandlerContext = createContext<BackHandlerContextData | null>(null)

export const useAndroidBackHandler = () => {
  const value = useContext(BackHandlerContext)

  if (!value) {
    throw new Error('Component must be a child of <AndroidBackHandlerProvider />')
  }

  return value
}

type ChildrenProps = {
  children: ReactNode
}

type ProviderProps = {
  application: WebApplication
} & ChildrenProps

const MemoizedChildren = memo(({ children }: ChildrenProps) => <div>{children}</div>)

const AndroidBackHandlerProvider = ({ application, children }: ProviderProps) => {
  return (
    <BackHandlerContext.Provider value={application.addBackHandlerEventListener.bind(application)}>
      <MemoizedChildren children={children} />
    </BackHandlerContext.Provider>
  )
}

export default observer(AndroidBackHandlerProvider)
