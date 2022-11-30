import { AppPaneId } from '../../Components/Panes/AppPaneMetadata'
import { PaneLayout } from './PaneLayout'
import { WebApplication } from '@/Application/Application'
import { getIsTabletOrMobileScreen } from '@/Hooks/useIsTabletOrMobileScreen'

export function panesForLayout(layout: PaneLayout, application: WebApplication): AppPaneId[] {
  const screen = getIsTabletOrMobileScreen(application)
  if (screen.isTablet) {
    if (layout === PaneLayout.TagSelection) {
      return [AppPaneId.Navigation, AppPaneId.Items]
    } else if (
      layout === PaneLayout.ItemSelection ||
      layout === PaneLayout.Editing ||
      layout === PaneLayout.FilesView
    ) {
      return [AppPaneId.Items, AppPaneId.Editor]
    }
  } else if (screen.isMobile) {
    if (layout === PaneLayout.TagSelection) {
      return [AppPaneId.Navigation]
    } else if (layout === PaneLayout.ItemSelection || layout === PaneLayout.FilesView) {
      return [AppPaneId.Navigation, AppPaneId.Items]
    } else if (layout === PaneLayout.Editing) {
      return [AppPaneId.Navigation, AppPaneId.Items, AppPaneId.Editor]
    }
  } else {
    if (layout === PaneLayout.FilesView) {
      return [AppPaneId.Navigation, AppPaneId.Items]
    } else {
      return [AppPaneId.Navigation, AppPaneId.Items, AppPaneId.Editor]
    }
  }

  throw Error(`Unhandled pane layout ${layout}`)
}

export function isPanesChangeLeafDismiss(from: AppPaneId[], to: AppPaneId[]): boolean {
  const fromWithoutLast = from.slice(0, from.length - 1)

  return fromWithoutLast.length === to.length && fromWithoutLast.every((pane, index) => pane === to[index])
}

export function isPanesChangePush(from: AppPaneId[], to: AppPaneId[]): boolean {
  const toWithoutLast = to.slice(0, to.length - 1)

  return toWithoutLast.length === from.length && toWithoutLast.every((pane, index) => pane === from[index])
}
