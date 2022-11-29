import { AppPaneId } from './../Components/ResponsivePane/AppPaneMetadata'
import { isMobileScreen, isTabletScreen } from '@/Utils'
import { PaneLayout } from './PaneLayout'

export function panesForLayout(layout: PaneLayout): AppPaneId[] {
  if (isTabletScreen()) {
    if (layout === PaneLayout.TagSelection) {
      return [AppPaneId.Navigation, AppPaneId.Items]
    } else if (layout === PaneLayout.ItemSelection || layout === PaneLayout.Editing) {
      return [AppPaneId.Items, AppPaneId.Editor]
    }
  } else if (isMobileScreen()) {
    if (layout === PaneLayout.TagSelection) {
      return [AppPaneId.Navigation]
    } else if (layout === PaneLayout.ItemSelection) {
      return [AppPaneId.Items]
    } else if (layout === PaneLayout.Editing) {
      return [AppPaneId.Editor]
    }
  } else {
    return [AppPaneId.Navigation, AppPaneId.Items, AppPaneId.Editor]
  }

  throw Error(`Unhandled pane layout ${layout}`)
}
