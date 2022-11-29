import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import ContentListView from '../ContentListView/ContentListView'
import NoteGroupView from '../NoteGroupView/NoteGroupView'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import Navigation from '../Tags/Navigation'
import { useApplication } from './ApplicationProvider'

const BaseClasses = 'grid flex flex-row'
const BaseStyles: React.CSSProperties = {
  gridTemplateRows: 'auto',
}

const PanesGrid = () => {
  const application = useApplication()
  const { panes, setPaneComponentProvider, getPaneComponent } = useResponsiveAppPane()
  const viewControllerManager = application.getViewControllerManager()

  useMemo(() => {
    setPaneComponentProvider(AppPaneId.Navigation, () => {
      return <Navigation key="navigation-pane" application={application} />
    })

    setPaneComponentProvider(AppPaneId.Items, () => {
      return (
        <ContentListView
          key="content-list-pane"
          application={application}
          accountMenuController={viewControllerManager.accountMenuController}
          filesController={viewControllerManager.filesController}
          itemListController={viewControllerManager.itemListController}
          navigationController={viewControllerManager.navigationController}
          noAccountWarningController={viewControllerManager.noAccountWarningController}
          notesController={viewControllerManager.notesController}
          selectionController={viewControllerManager.selectionController}
          searchOptionsController={viewControllerManager.searchOptionsController}
          linkingController={viewControllerManager.linkingController}
        />
      )
    })

    setPaneComponentProvider(AppPaneId.Editor, () => {
      return (
        <ErrorBoundary key="editor-pane">
          <NoteGroupView application={application} />
        </ErrorBoundary>
      )
    })
  }, [application, viewControllerManager, setPaneComponentProvider])

  const computeStyles = (): React.CSSProperties => {
    const numPanes = panes.length

    if (numPanes === 1) {
      return {
        gridTemplateColumns: 'auto',
      }
    } else if (numPanes === 2) {
      return {
        gridTemplateColumns: 'auto 2fr',
      }
    } else if (numPanes === 3) {
      return {
        gridTemplateColumns: 'auto auto 2fr',
      }
    } else {
      return {}
    }
  }

  return (
    <div id="app" className={`app ${BaseClasses}`} style={{ ...BaseStyles, ...computeStyles() }}>
      {panes.map((pane) => {
        return getPaneComponent(pane)
      })}
    </div>
  )
}

export default observer(PanesGrid)
