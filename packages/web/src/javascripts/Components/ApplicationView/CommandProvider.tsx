import { ReactNode, createContext, useContext, memo } from 'react'

import { observer } from 'mobx-react-lite'
import { KeyboardService } from '@standardnotes/ui-services'

const CommandServiceContext = createContext<KeyboardService | undefined>(undefined)

export const useCommandService = () => {
  const value = useContext(CommandServiceContext)

  if (!value) {
    throw new Error('Component must be a child of <CommandServiceProvider />')
  }

  return value
}

type ChildrenProps = {
  children: ReactNode
}

type ProviderProps = {
  service: KeyboardService
} & ChildrenProps

const MemoizedChildren = memo(({ children }: ChildrenProps) => <>{children}</>)

const CommandServiceProvider = ({ service, children }: ProviderProps) => {
  return (
    <CommandServiceContext.Provider value={service}>
      <MemoizedChildren children={children} />
    </CommandServiceContext.Provider>
  )
}

export default observer(CommandServiceProvider)
