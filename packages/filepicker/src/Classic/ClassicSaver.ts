import { saveFile } from '../utils'

export class ClassicFileSaver {
  public loggingEnabled = false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private log(...args: any[]): void {
    if (!this.loggingEnabled) {
      return
    }
    // eslint-disable-next-line no-console
    console.log(args)
  }

  static maximumFileSize(): number {
    return 50 * 1_000_000
  }

  saveFile(name: string, bytes: Uint8Array): void {
    this.log('Saving file to disk...')
    saveFile(name, bytes)
    this.log('Closing write stream')
  }
}
