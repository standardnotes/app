import { useStateRef } from '@/Hooks/useStateRef'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import { useEffect } from 'react'

type Props = {
  close: () => void
}

const ModalAndroidBackHandler = ({ close }: Props) => {
  const addAndroidBackHandler = useAndroidBackHandler()
  const closeFnRef = useStateRef(close)

  useEffect(() => {
    const removeListener = addAndroidBackHandler(() => {
      closeFnRef.current()
      return true
    })
    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [addAndroidBackHandler, closeFnRef])

  return null
}

export default ModalAndroidBackHandler
