export class PhotoRecorder {
  public video!: HTMLVideoElement

  private canvas!: HTMLCanvasElement
  private width!: number
  private height!: number
  private stream!: MediaStream

  constructor(private fileName: string) {}

  public static async isSupported(): Promise<boolean> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const hasCamera = devices.some((device) => device.kind === 'videoinput')
    return hasCamera
  }

  public async initialize() {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })

    this.video = document.createElement('video')
    this.video.playsInline = true
    this.video.style.position = 'absolute'
    this.video.style.display = 'none'

    this.canvas = document.createElement('canvas')

    document.body.append(this.video)
    this.video.srcObject = this.stream

    await this.video.play()
    await this.awaitVideoReady(this.video)

    const videoTrack = this.stream.getVideoTracks()[0]
    const settings = videoTrack.getSettings()
    this.width = settings.width ?? 1280
    this.height = settings.height ?? 720

    this.canvas.width = this.width
    this.canvas.height = this.height
  }

  public async takePhoto(): Promise<File | undefined> {
    const context = this.canvas.getContext('2d')
    context?.drawImage(this.video, 0, 0, this.width, this.height)
    const dataUrl = this.canvas.toDataURL('image/png')

    const isFailedImage = dataUrl.length < 100000

    if (isFailedImage) {
      return undefined
    }

    const res: Response = await fetch(dataUrl)
    const blob: Blob = await res.blob()
    const file = new File([blob], this.fileName, { type: 'image/png' })
    return file
  }

  public finish() {
    this.video.pause()

    this.video.parentElement?.removeChild(this.video)
    this.canvas.parentElement?.removeChild(this.canvas)

    this.video.remove()
    this.canvas.remove()

    this.stream.getTracks().forEach((track) => {
      track.stop()
    })
  }

  private async awaitVideoReady(video: HTMLVideoElement) {
    return new Promise((resolve) => {
      video.addEventListener('canplaythrough', () => {
        resolve(null)
      })
    })
  }
}
