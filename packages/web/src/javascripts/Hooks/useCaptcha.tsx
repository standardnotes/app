import { useEffect } from 'react'

export const useCaptcha = (captchaURL: string, callback: (token: string) => void) => {
  useEffect(() => {
    function handleCaptchaEvent(event: any) {
      if (event?.data?.type?.includes('captcha')) {
        callback(event.data.token)
      }
    }

    window.addEventListener('message', handleCaptchaEvent)

    return () => {
      window.removeEventListener('message', handleCaptchaEvent)
    }
  }, [callback])

  if (!captchaURL) {
    return null
  }

  return <iframe src={captchaURL} height={480}></iframe>
}
