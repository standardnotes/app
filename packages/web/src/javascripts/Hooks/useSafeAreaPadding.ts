import { ReactNativeToWebEvent } from '@standardnotes/snjs'
import { useApplication } from '@/Components/ApplicationProvider'
import { useEffect, useState } from 'react'

export const useAvailableSafeAreaPadding = () => {
  const documentStyle = getComputedStyle(document.documentElement)

  const top = parseInt(documentStyle.getPropertyValue('--safe-area-inset-top'))
  const right = parseInt(documentStyle.getPropertyValue('--safe-area-inset-right'))
  const bottom = parseInt(documentStyle.getPropertyValue('--safe-area-inset-bottom'))
  const left = parseInt(documentStyle.getPropertyValue('--safe-area-inset-left'))

  const application = useApplication()
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  useEffect(() => {
    return application.addNativeMobileEventListener((event) => {
      if (event === ReactNativeToWebEvent.KeyboardWillShow || event === ReactNativeToWebEvent.KeyboardDidShow) {
        setIsKeyboardVisible(true)
      } else if (event === ReactNativeToWebEvent.KeyboardWillHide || event === ReactNativeToWebEvent.KeyboardDidHide) {
        setIsKeyboardVisible(false)
      }
    })
  }, [application])

  return {
    hasTopInset: !!top,
    hasRightInset: !!right,
    hasBottomInset: !!bottom && !isKeyboardVisible,
    hasLeftInset: !!left,
  }
}
