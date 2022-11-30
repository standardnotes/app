import { AppPaneId } from './../Components/ResponsivePane/AppPaneMetadata'
import { isMobileScreen, isTabletScreen } from '@/Utils'
import { PaneLayout } from './PaneLayout'

export function panesForLayout(layout: PaneLayout): AppPaneId[] {
  if (isTabletScreen()) {
    if (layout === PaneLayout.TagSelection) {
      return [AppPaneId.Navigation, AppPaneId.Items]
    } else if (
      layout === PaneLayout.ItemSelection ||
      layout === PaneLayout.Editing ||
      layout === PaneLayout.FilesView
    ) {
      return [AppPaneId.Items, AppPaneId.Editor]
    }
  } else if (isMobileScreen()) {
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
