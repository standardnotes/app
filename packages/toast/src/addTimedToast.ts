import { addToast, dismissToast, updateToast } from './toastStore'
import { ToastOptions } from './types'

type InitialToastOptions = Omit<ToastOptions, 'message'> & {
  message: (timeRemainingInSeconds: number) => string
}

export const addTimedToast = (
  initialOptions: InitialToastOptions,
  callback: () => void,
  timeInSeconds: number,
): [string, number] => {
  let timeRemainingInSeconds = timeInSeconds

  const intervalId = window.setInterval(() => {
    timeRemainingInSeconds--
    if (timeRemainingInSeconds > 0) {
      updateToast(toastId, {
        message: initialOptions.message(timeRemainingInSeconds),
      })
    } else {
      dismissToast(toastId)
      clearInterval(intervalId)
      callback()
    }
  }, 1000)

  const toastId = addToast({
    ...initialOptions,
    message: initialOptions.message(timeRemainingInSeconds),
    autoClose: false,
  })

  return [toastId, intervalId]
}
