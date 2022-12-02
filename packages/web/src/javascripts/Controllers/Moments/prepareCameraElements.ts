export async function awaitVideoReady(video: HTMLVideoElement) {
  return new Promise((resolve) => {
    video.addEventListener('canplaythrough', () => {
      resolve(null)
    })
  })
}

export function stopCameraStream(canvas: HTMLCanvasElement, video: HTMLVideoElement, stream: MediaStream) {
  video.pause()
  video.parentElement?.removeChild(video)
  canvas.parentElement?.removeChild(canvas)
  video.remove()
  canvas.remove()

  stream.getTracks().forEach((track) => {
    track.stop()
  })
}

export async function takePhoto(
  filename: string,
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  width: number,
  height: number,
): Promise<File | undefined> {
  const context = canvas.getContext('2d')
  context?.drawImage(video, 0, 0, width, height)
  const dataUrl = canvas.toDataURL('image/png')

  const isFailedImage = dataUrl.length < 100000

  if (isFailedImage) {
    return undefined
  }

  const res: Response = await fetch(dataUrl)
  const blob: Blob = await res.blob()
  const file = new File([blob], filename, { type: 'image/png' })
  return file
}

export async function preparePhotoOperation() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  const video = document.createElement('video')
  video.style.position = 'absolute'
  video.style.display = 'none'
  const canvas = document.createElement('canvas')
  document.body.append(video)
  video.srcObject = stream
  await video.play()
  await awaitVideoReady(video)

  const videoTrack = stream.getVideoTracks()[0]
  const settings = videoTrack.getSettings()
  const width = settings.width ?? 1280
  const height = settings.height ?? 720

  canvas.width = width
  canvas.height = height

  return { canvas, video, stream, width, height }
}
