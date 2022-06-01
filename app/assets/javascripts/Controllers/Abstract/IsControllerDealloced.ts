import { AbstractViewController } from './AbstractViewController'

export function isControllerDealloced(state: AbstractViewController): boolean {
  return state.dealloced == undefined || state.dealloced === true
}
