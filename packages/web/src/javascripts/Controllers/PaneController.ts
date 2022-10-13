import { AppPaneId } from './../Components/ResponsivePane/AppPaneMetadata'
import { isMobileScreen } from '@/Utils'
import { makeObservable, observable } from 'mobx'

export class PaneController {
  currentPane: AppPaneId = isMobileScreen() ? AppPaneId.Items : AppPaneId.Editor
  previousPane: AppPaneId = isMobileScreen() ? AppPaneId.Items : AppPaneId.Editor

  constructor() {
    makeObservable(this, {
      currentPane: observable,
      previousPane: observable,
    })
  }
}
