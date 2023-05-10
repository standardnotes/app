export const useAvailableSafeAreaPadding = () => {
  const documentStyle = getComputedStyle(document.documentElement)

  const top = parseInt(documentStyle.getPropertyValue('--safe-area-inset-top'))
  const right = parseInt(documentStyle.getPropertyValue('--safe-area-inset-right'))
  const bottom = parseInt(documentStyle.getPropertyValue('--safe-area-inset-bottom'))
  const left = parseInt(documentStyle.getPropertyValue('--safe-area-inset-left'))

  return {
    hasTopInset: !!top,
    hasRightInset: !!right,
    hasBottomInset: !!bottom,
    hasLeftInset: !!left,
  }
}
