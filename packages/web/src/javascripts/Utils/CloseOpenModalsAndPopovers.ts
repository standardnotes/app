export type DialogWithClose = HTMLDivElement & { close: () => void }

export const requestCloseAllOpenModalsAndPopovers = () => {
  document.querySelectorAll('[role="dialog"], [data-popover]').forEach((element) => {
    // We add the close method to dialog & popovers to allow us to
    // close them from anywhere in the app.
    if ('close' in element && typeof element.close === 'function') {
      element.close()
    }
  })
}
