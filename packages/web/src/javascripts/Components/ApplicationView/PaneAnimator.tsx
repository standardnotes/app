import { log, LoggingDomain } from '@/Logging'

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
      duration: 400,
      easing: 'ease-in-out',
      fill: 'backwards',
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
      duration: 400,
      easing: 'ease-in-out',
      fill: 'forwards',
    },
  )

  await animation.finished

  animation.finish()
}
