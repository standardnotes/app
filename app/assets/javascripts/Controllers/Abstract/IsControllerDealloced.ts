export function isControllerDealloced(controller: { dealloced: boolean }): boolean {
  return controller.dealloced == undefined || controller.dealloced === true
}
