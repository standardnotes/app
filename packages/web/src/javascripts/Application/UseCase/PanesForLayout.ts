import { AppPaneId } from './../../Components/Panes/AppPaneMetadata'
import { PaneLayout } from './../../Controllers/PaneController/PaneLayout'
import { IsTabletOrMobileScreen } from './IsTabletOrMobileScreen'
import { Result, SyncUseCaseInterface } from '@standardnotes/snjs'

export class PanesForLayout implements SyncUseCaseInterface<AppPaneId[]> {
  constructor(private _isTabletOrMobileScreen: IsTabletOrMobileScreen) {}

  execute(layout: PaneLayout): Result<AppPaneId[]> {
    const screen = this._isTabletOrMobileScreen.execute().getValue()
    if (screen.isTablet) {
      if (layout === PaneLayout.TagSelection || layout === PaneLayout.TableView) {
        return Result.ok([AppPaneId.Navigation, AppPaneId.Items])
      } else if (layout === PaneLayout.ItemSelection || layout === PaneLayout.Editing) {
        return Result.ok([AppPaneId.Items, AppPaneId.Editor])
      }
    } else if (screen.isMobile) {
      if (layout === PaneLayout.TagSelection) {
        return Result.ok([AppPaneId.Navigation])
      } else if (layout === PaneLayout.ItemSelection || layout === PaneLayout.TableView) {
        return Result.ok([AppPaneId.Navigation, AppPaneId.Items])
      } else if (layout === PaneLayout.Editing) {
        return Result.ok([AppPaneId.Navigation, AppPaneId.Items, AppPaneId.Editor])
      }
    } else {
      if (layout === PaneLayout.TableView) {
        return Result.ok([AppPaneId.Navigation, AppPaneId.Items])
      } else {
        return Result.ok([AppPaneId.Navigation, AppPaneId.Items, AppPaneId.Editor])
      }
    }

    throw Error('Unhandled pane layout')
  }
}
