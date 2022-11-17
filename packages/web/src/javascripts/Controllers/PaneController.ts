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

    const mediaQuery = window.matchMedia(MediaQueryBreakpoints.md)
    if (mediaQuery?.addEventListener != undefined) {
      mediaQuery.addEventListener('change', this.mediumScreenMQHandler)
    } else {
      mediaQuery.addListener(this.mediumScreenMQHandler)
    }
  }

  deinit() {
    const mq = window.matchMedia(MediaQueryBreakpoints.md)
    if (mq?.removeEventListener != undefined) {
      mq.removeEventListener('change', this.mediumScreenMQHandler)
    } else {
      mq.removeListener(this.mediumScreenMQHandler)
    }
  }

  mediumScreenMQHandler = (event: MediaQueryListEvent) => {
    if (event.matches) {
      this.setIsInMobileView(false)
    } else {
      this.setIsInMobileView(true)
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
