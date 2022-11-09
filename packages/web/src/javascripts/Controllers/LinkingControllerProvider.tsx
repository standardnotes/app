import { ReactNode, createContext, useContext, memo } from 'react'
import { observer } from 'mobx-react-lite'
import { LinkingController } from '@/Controllers/LinkingController'

const LinkingControllerContext = createContext<LinkingController | undefined>(undefined)

export const useLinkingController = () => {
  const value = useContext(LinkingControllerContext)

  if (!value) {
    throw new Error('Component must be a child of <LinkingControllerProvider />')
  }

  return value
}

type ChildrenProps = {
  children: ReactNode
}

type ProviderProps = {
  controller: LinkingController
} & ChildrenProps

const MemoizedChildren = memo(({ children }: ChildrenProps) => <>{children}</>)

const LinkingControllerProvider = ({ controller, children }: ProviderProps) => {
  return (
    <LinkingControllerContext.Provider value={controller}>
      <MemoizedChildren children={children} />
    </LinkingControllerContext.Provider>
  )
}

export default observer(LinkingControllerProvider)
