import { AppPaneId } from './../Components/ResponsivePane/AppPaneMetadata'
import { isMobileScreen } from '@/Utils'
import { makeObservable, observable, action } from 'mobx'

export class PaneController {
  currentPane: AppPaneId = isMobileScreen() ? AppPaneId.Items : AppPaneId.Editor
  previousPane: AppPaneId = isMobileScreen() ? AppPaneId.Items : AppPaneId.Editor

  constructor() {
    makeObservable(this, {
      currentPane: observable,
      previousPane: observable,

      setCurrentPane: action,
      setPreviousPane: action,
    })
  }

  setCurrentPane(pane: AppPaneId): void {
    this.currentPane = pane
  }

  setPreviousPane(pane: AppPaneId): void {
    this.previousPane = pane
  }
}
