import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import { useEffect, ReactNode, useMemo, createContext, useCallback, useContext, memo } from 'react'
import { AppPaneId } from './AppPaneMetadata'
import { PaneController } from '../../Controllers/PaneController/PaneController'
import { observer } from 'mobx-react-lite'
import { PaneLayout } from '@/Controllers/PaneController/PaneLayout'
import { useStateRef } from '@/Hooks/useStateRef'

type ResponsivePaneData = {
  selectedPane: AppPaneId
  toggleListPane: () => void
  toggleNavigationPane: () => void
  isListPaneCollapsed: boolean
  isNavigationPaneCollapsed: boolean
  panes: PaneController['panes']
  toggleAppPane: (paneId: AppPaneId) => void
  presentPane: PaneController['presentPane']
  popToPane: PaneController['popToPane']
  dismissLastPane: PaneController['dismissLastPane']
  replacePanes: PaneController['replacePanes']
  removePane: PaneController['removePane']
  insertPaneAtIndex: PaneController['insertPaneAtIndex']
  setPaneLayout: PaneController['setPaneLayout']
  focusModeEnabled: PaneController['focusModeEnabled']
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

const MemoizedChildren = memo(({ children }: ChildrenProps) => <>{children}</>)

const ResponsivePaneProvider = ({ paneController, children }: ProviderProps) => {
  const currentSelectedPane = paneController.currentPane
  const currentSelectedPaneRef = useStateRef<AppPaneId>(currentSelectedPane)

  const toggleAppPane = useCallback(
    (paneId: AppPaneId) => {
      paneController.presentPane(paneId)
    },
    [paneController],
  )

  const addAndroidBackHandler = useAndroidBackHandler()

  useEffect(() => {
    const removeListener = addAndroidBackHandler(() => {
      if (
        currentSelectedPaneRef.current === AppPaneId.Editor ||
        currentSelectedPaneRef.current === AppPaneId.Navigation
      ) {
        paneController.setPaneLayout(PaneLayout.ItemSelection)
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
  }, [addAndroidBackHandler, currentSelectedPaneRef, paneController])

  const contextValue = useMemo(
    (): ResponsivePaneData => ({
      selectedPane: currentSelectedPane,
      toggleAppPane,
      presentPane: paneController.presentPane,
      isListPaneCollapsed: paneController.isListPaneCollapsed,
      isNavigationPaneCollapsed: paneController.isNavigationPaneCollapsed,
      toggleListPane: paneController.toggleListPane,
      toggleNavigationPane: paneController.toggleNavigationPane,
      panes: paneController.panes,
      popToPane: paneController.popToPane,
      dismissLastPane: paneController.dismissLastPane,
      replacePanes: paneController.replacePanes,
      removePane: paneController.removePane,
      insertPaneAtIndex: paneController.insertPaneAtIndex,
      setPaneLayout: paneController.setPaneLayout,
      focusModeEnabled: paneController.focusModeEnabled,
    }),
    [
      currentSelectedPane,
      toggleAppPane,
      paneController.panes,
      paneController.isListPaneCollapsed,
      paneController.isNavigationPaneCollapsed,
      paneController.toggleListPane,
      paneController.toggleNavigationPane,
      paneController.presentPane,
      paneController.popToPane,
      paneController.dismissLastPane,
      paneController.replacePanes,
      paneController.removePane,
      paneController.insertPaneAtIndex,
      paneController.setPaneLayout,
      paneController.focusModeEnabled,
    ],
  )

  return (
    <ResponsivePaneContext.Provider value={contextValue}>
      <MemoizedChildren children={children} />
    </ResponsivePaneContext.Provider>
  )
}

export default observer(ResponsivePaneProvider)
