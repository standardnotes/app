import { AppPaneId } from '../../Components/Panes/AppPaneMetadata'

export function isPanesChangeLeafDismiss(from: AppPaneId[], to: AppPaneId[]): boolean {
  const fromWithoutLast = from.slice(0, from.length - 1)

  return fromWithoutLast.length === to.length && fromWithoutLast.every((pane, index) => pane === to[index])
}

export function isPanesChangePush(from: AppPaneId[], to: AppPaneId[]): boolean {
  const toWithoutLast = to.slice(0, to.length - 1)

  return toWithoutLast.length === from.length && toWithoutLast.every((pane, index) => pane === from[index])
}
