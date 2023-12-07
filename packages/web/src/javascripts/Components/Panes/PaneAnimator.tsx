import { log, LoggingDomain } from '@/Logging'

const ENTRANCE_DURATION = 200
const EXIT_DURATION = 200

export async function animatePaneEntranceTransitionFromOffscreenToTheRight(elementId: string): Promise<void> {
  log(LoggingDomain.Panes, 'Animating pane entrance transition from offscreen to the right', elementId)
  const element = document.getElementById(elementId)
  if (!element) {
    return
  }

  const animation = element.animate(
    [
      {
        transform: 'translateX(100%)',
      },
      {
        transform: 'translateX(0)',
      },
    ],
    {
      duration: ENTRANCE_DURATION,
      easing: 'ease-in-out',
      fill: 'both',
    },
  )

  await animation.finished

  performSafariAnimationFix(element)
}

export async function animatePaneExitTransitionOffscreenToTheRight(elementId: string): Promise<void> {
  log(LoggingDomain.Panes, 'Animating pane exit transition offscreen to the right', elementId)
  const element = document.getElementById(elementId)
  if (!element) {
    return
  }

  const animation = element.animate(
    [
      {
        transform: 'translateX(100%)',
      },
    ],
    {
      duration: EXIT_DURATION,
      easing: 'ease-in-out',
      fill: 'both',
    },
  )

  await animation.finished
}

/**
 * Safari has a bug where animations don't properly commit sometimes and a tap on the screen or click anywhere fixes it.
 * The workaround here is just to get Safari to recompute the element layout. This issue manifests itself when selecting
 * a Daily Notebook tag from navigation whereby two pane animations are simulatensouly triggered (the items panel, then
 * the editor panel), causing Safari to get tripped up.
 */
export function performSafariAnimationFix(element: HTMLElement): void {
  const isSafari = /Safari/.test(navigator.userAgent) || /AppleWebKit/.test(navigator.userAgent)
  if (!isSafari) {
    return
  }

  element.style.opacity = '0.999'
  setTimeout(() => {
    element.style.opacity = '1.0'
  }, 0)
}
