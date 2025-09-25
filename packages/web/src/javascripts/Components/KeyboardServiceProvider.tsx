import { ReactNode, createContext, useContext, memo } from 'react'

import { observer } from 'mobx-react-lite'
import { KeyboardService } from '@standardnotes/ui-services'

const KeyboardServiceContext = createContext<KeyboardService | undefined>(undefined)

export const useKeyboardService = () => {
  const value = useContext(KeyboardServiceContext)

  if (!value) {
    throw new Error('Component must be a child of <KeyboardServiceProvider />')
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

const KeyboardServiceProvider = ({ service, children }: ProviderProps) => {
  return (
    <KeyboardServiceContext.Provider value={service}>
      <MemoizedChildren children={children} />
    </KeyboardServiceContext.Provider>
  )
}

export default observer(KeyboardServiceProvider)
