import { classNames, ReactNativeToWebEvent } from '@standardnotes/snjs'
import { useEffect, useState } from 'react'
import { useApplication } from '../ApplicationProvider'
import Icon from '../Icon/Icon'

const IosKeyboardClose = () => {
  const application = useApplication()
  const [isVisible, setIsVisible] = useState(false)
  const [isFocusInSuperEditor, setIsFocusInSuperEditor] = useState(
    () => !!document.activeElement?.closest('#blocks-editor'),
  )

  useEffect(() => {
    return application.addNativeMobileEventListener((event) => {
      if (event === ReactNativeToWebEvent.KeyboardWillShow) {
        setIsVisible(true)
      } else if (event === ReactNativeToWebEvent.KeyboardWillHide) {
        setIsVisible(false)
      }
    })
  }, [application])

  useEffect(() => {
    const handleFocusChange = () => {
      setIsFocusInSuperEditor(!!document.activeElement?.closest('#blocks-editor'))
    }

    document.addEventListener('focusin', handleFocusChange)
    document.addEventListener('focusout', handleFocusChange)

    return () => {
      document.removeEventListener('focusin', handleFocusChange)
      document.removeEventListener('focusout', handleFocusChange)
    }
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <button
      className={classNames(
        'absolute bottom-3 right-3 rounded-full border border-border bg-contrast p-3',
        isFocusInSuperEditor && 'hidden',
      )}
    >
      <Icon type="keyboard-close" />
    </button>
  )
}

export default IosKeyboardClose
