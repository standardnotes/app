import { ElementIds } from '@/Constants/ElementIDs'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
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
import { PaneController } from '../../Controllers/PaneController'
import { observer } from 'mobx-react-lite'

type ResponsivePaneData = {
  selectedPane: AppPaneId
  toggleNotesListOnTablets: () => void
  toggleListPane: () => void
  toggleNavigationPane: () => void
  isNotesListVisibleOnTablets: boolean
  isListPaneCollapsed: boolean
  isNavigationPaneCollapsed: boolean
  setPaneComponentProvider: PaneController['setPaneComponentProvider']
  getPaneComponent: PaneController['getPaneComponent']
  panes: PaneController['panes']
  toggleAppPane: (paneId: AppPaneId) => void
  presentPane: PaneController['presentPane']
  popToPane: PaneController['popToPane']
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

type ProviderProps = {
  paneController: PaneController
} & ChildrenProps

function useStateRef<State>(state: State): MutableRefObject<State> {
  const ref = useRef<State>(state)

  useLayoutEffect(() => {
    ref.current = state
  }, [state])

  return ref
}

const MemoizedChildren = memo(({ children }: ChildrenProps) => <>{children}</>)

const ResponsivePaneProvider = ({ paneController, children }: ProviderProps) => {
  const currentSelectedPane = paneController.currentPane
  const previousSelectedPane = paneController.previousPane
  const currentSelectedPaneRef = useStateRef<AppPaneId>(currentSelectedPane)

  const toggleAppPane = useCallback(
    (paneId: AppPaneId) => {
      paneController.presentPane(paneId)
    },
    [paneController],
  )

  useEffect(() => {
    if (previousSelectedPane) {
      const previousPaneElement = document.getElementById(ElementIds[previousSelectedPane])
      previousPaneElement?.removeAttribute('data-selected-pane')
    }

    const currentPaneElement = document.getElementById(ElementIds[currentSelectedPane])
    currentPaneElement?.setAttribute('data-selected-pane', '')
  }, [currentSelectedPane, previousSelectedPane])

  const addAndroidBackHandler = useAndroidBackHandler()

  useEffect(() => {
    const removeListener = addAndroidBackHandler(() => {
      if (
        currentSelectedPaneRef.current === AppPaneId.Editor ||
        currentSelectedPaneRef.current === AppPaneId.Navigation
      ) {
        toggleAppPane(AppPaneId.Items)
        return true
      } else {
        return false
      }
    })
    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [addAndroidBackHandler, currentSelectedPaneRef, toggleAppPane])

  const [isNotesListVisibleOnTablets, setNotesListVisibleOnTablets] = useState(true)

  const toggleNotesListOnTablets = useCallback(() => {
    setNotesListVisibleOnTablets((visible) => !visible)
  }, [])

  const contextValue = useMemo(
    (): ResponsivePaneData => ({
      selectedPane: currentSelectedPane,
      toggleAppPane,
      presentPane: paneController.presentPane,
      isNotesListVisibleOnTablets,
      toggleNotesListOnTablets,
      isListPaneCollapsed: paneController.isListPaneCollapsed,
      isNavigationPaneCollapsed: paneController.isNavigationPaneCollapsed,
      toggleListPane: paneController.toggleListPane,
      toggleNavigationPane: paneController.toggleNavigationPane,
      panes: paneController.panes,
      setPaneComponentProvider: paneController.setPaneComponentProvider,
      getPaneComponent: paneController.getPaneComponent,
      popToPane: paneController.popToPane,
    }),
    [
      currentSelectedPane,
      toggleAppPane,
      isNotesListVisibleOnTablets,
      toggleNotesListOnTablets,
      paneController.panes,
      paneController.isListPaneCollapsed,
      paneController.isNavigationPaneCollapsed,
      paneController.toggleListPane,
      paneController.toggleNavigationPane,
      paneController.setPaneComponentProvider,
      paneController.getPaneComponent,
      paneController.presentPane,
      paneController.popToPane,
    ],
  )

  return (
    <ResponsivePaneContext.Provider value={contextValue}>
      <MemoizedChildren children={children} />
    </ResponsivePaneContext.Provider>
  )
}

export default observer(ResponsivePaneProvider)
