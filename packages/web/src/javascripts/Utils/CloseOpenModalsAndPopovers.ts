export const requestCloseAllOpenModalsAndPopovers = () => {
  document.querySelectorAll('[role="dialog"], [data-popover]').forEach((element) => {
    if ('close' in element && typeof element.close === 'function') {
      element.close()
    }
  })
}
