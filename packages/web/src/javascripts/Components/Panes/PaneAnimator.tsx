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
      fill: 'forwards',
    },
  )

  await animation.finished

  animation.finish()
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
        transform: 'translateX(0)',
      },
      {
        transform: 'translateX(100%)',
      },
    ],
    {
      duration: EXIT_DURATION,
      easing: 'ease-in-out',
      fill: 'forwards',
    },
  )

  await animation.finished

  animation.finish()
}
