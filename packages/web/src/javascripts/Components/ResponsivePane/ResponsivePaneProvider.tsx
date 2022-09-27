import { ElementIds } from '@/Constants/ElementIDs'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import { isMobileScreen } from '@/Utils'
import {
  useEffect,
  ReactNode,
  useMemo,
  createContext,
  useCallback,
  useContext,
  useState,
  memo,
  useRef,
  useLayoutEffect,
  MutableRefObject,
} from 'react'
import { AppPaneId } from './AppPaneMetadata'

type ResponsivePaneData = {
  selectedPane: AppPaneId
  toggleAppPane: (paneId: AppPaneId) => void
}

const ResponsivePaneContext = createContext<ResponsivePaneData | undefined>(undefined)

export const useResponsiveAppPane = () => {
  const value = useContext(ResponsivePaneContext)

  if (!value) {
    throw new Error('Component must be a child of <ResponsivePaneProvider />')
  }

  return value
}

type ChildrenProps = {
  children: ReactNode
}

function useStateRef<State>(state: State): MutableRefObject<State> {
  const ref = useRef<State>(state)

  useLayoutEffect(() => {
    ref.current = state
  }, [state])

  return ref
}

const MemoizedChildren = memo(({ children }: ChildrenProps) => <div>{children}</div>)

const ResponsivePaneProvider = ({ children }: ChildrenProps) => {
  const [currentSelectedPane, setCurrentSelectedPane] = useState<AppPaneId>(
    isMobileScreen() ? AppPaneId.Items : AppPaneId.Editor,
  )
  const currentSelectedPaneRef = useStateRef<AppPaneId>(currentSelectedPane)
  const [previousSelectedPane, setPreviousSelectedPane] = useState<AppPaneId>(
    isMobileScreen() ? AppPaneId.Items : AppPaneId.Editor,
  )

  const toggleAppPane = useCallback(
    (paneId: AppPaneId) => {
      if (paneId === currentSelectedPane) {
        setCurrentSelectedPane(previousSelectedPane ? previousSelectedPane : AppPaneId.Editor)
        setPreviousSelectedPane(paneId)
      } else {
        setPreviousSelectedPane(currentSelectedPane)
        setCurrentSelectedPane(paneId)
      }
    },
    [currentSelectedPane, previousSelectedPane],
  )

  useEffect(() => {
    if (previousSelectedPane) {
      const previousPaneElement = document.getElementById(ElementIds[previousSelectedPane])
      previousPaneElement?.classList.remove('selected')
    }

    const currentPaneElement = document.getElementById(ElementIds[currentSelectedPane])
    currentPaneElement?.classList.add('selected')
  }, [currentSelectedPane, previousSelectedPane])

  const addAndroidBackHandler = useAndroidBackHandler()

  useEffect(() => {
    const removeListener = addAndroidBackHandler(() => {
      if (
        currentSelectedPaneRef.current === AppPaneId.Editor ||
        currentSelectedPaneRef.current === AppPaneId.Navigation
      ) {
        toggleAppPane(AppPaneId.Items)
      }

      return true
    })
    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [addAndroidBackHandler, currentSelectedPaneRef, toggleAppPane])

  const contextValue = useMemo(
    () => ({
      selectedPane: currentSelectedPane,
      toggleAppPane,
    }),
    [currentSelectedPane, toggleAppPane],
  )

  return (
    <ResponsivePaneContext.Provider value={contextValue}>
      <MemoizedChildren children={children} />
    </ResponsivePaneContext.Provider>
  )
}

export default ResponsivePaneProvider
