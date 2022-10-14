import { AppPaneId } from './../Components/ResponsivePane/AppPaneMetadata'
import { isMobileScreen } from '@/Utils'
import { makeObservable, observable, action } from 'mobx'
import { Disposer } from '@/Types/Disposer'
import { MediaQueryBreakpoints } from '@/Hooks/useMediaQuery'

export class PaneController {
  currentPane: AppPaneId = isMobileScreen() ? AppPaneId.Items : AppPaneId.Editor
  previousPane: AppPaneId = isMobileScreen() ? AppPaneId.Items : AppPaneId.Editor
  isInMobileView = isMobileScreen()
  protected disposers: Disposer[] = []

  constructor() {
    makeObservable(this, {
      currentPane: observable,
      previousPane: observable,
      isInMobileView: observable,

      setCurrentPane: action,
      setPreviousPane: action,
      setIsInMobileView: action,
    })

    window.matchMedia(MediaQueryBreakpoints.md).addEventListener('change', this.mediumScreenMQHandler)
  }

  deinit() {
    window.matchMedia(MediaQueryBreakpoints.md).removeEventListener('change', this.mediumScreenMQHandler)
  }

  mediumScreenMQHandler = (event: MediaQueryListEvent) => {
    if (event.matches) {
      this.isInMobileView = false
    } else {
      this.isInMobileView = true
    }
  }

  setCurrentPane(pane: AppPaneId): void {
    this.currentPane = pane
  }

  setPreviousPane(pane: AppPaneId): void {
    this.previousPane = pane
  }

  setIsInMobileView(isInMobileView: boolean) {
    this.isInMobileView = isInMobileView
  }
}
