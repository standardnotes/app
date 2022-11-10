import { ReactNode, createContext, useContext, memo } from 'react'
import { observer } from 'mobx-react-lite'
import { FilesController } from '@/Controllers/FilesController'

const FilesControllerContext = createContext<FilesController | undefined>(undefined)

export const useFilesController = () => {
  const value = useContext(FilesControllerContext)

  if (!value) {
    throw new Error('Component must be a child of <FilesControllerProvider />')
  }

  return value
}

type ChildrenProps = {
  children: ReactNode
}

type ProviderProps = {
  controller: FilesController
} & ChildrenProps

const MemoizedChildren = memo(({ children }: ChildrenProps) => <>{children}</>)

const FilesControllerProvider = ({ controller, children }: ProviderProps) => {
  return (
    <FilesControllerContext.Provider value={controller}>
      <MemoizedChildren children={children} />
    </FilesControllerContext.Provider>
  )
}

export default observer(FilesControllerProvider)
