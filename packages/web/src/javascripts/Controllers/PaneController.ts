import { AppPaneId } from './../Components/ResponsivePane/AppPaneMetadata'
import { isMobileScreen } from '@/Utils'

export class PaneController {
  public currentPane: AppPaneId = isMobileScreen() ? AppPaneId.Items : AppPaneId.Editor
  public previousPane: AppPaneId = isMobileScreen() ? AppPaneId.Items : AppPaneId.Editor
}
