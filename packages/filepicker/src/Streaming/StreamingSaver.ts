/**
 * The File System Access API File Picker
 * https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 */
export class StreamingFileSaver {
  public loggingEnabled = false
  private writableStream!: FileSystemWritableFileStream

  constructor(private name: string) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private log(...args: any[]): void {
    if (!this.loggingEnabled) {
      return
    }
    // eslint-disable-next-line no-console
    console.log(args)
  }

  static available(): boolean {
    return window.showSaveFilePicker != undefined
  }

  /**
   * This function must be called in response to a user interaction, otherwise, it will be rejected by the browser.
   * @returns Whether file was successfully selected or not.
   */
  async selectFileToSaveTo(handle?: FileSystemFileHandle): Promise<boolean> {
    this.log('Showing save file picker')

    try {
      const downloadHandle = handle
        ? handle
        : await window.showSaveFilePicker({
            suggestedName: this.name,
          })

      if (!downloadHandle) {
        return false
      }

      this.writableStream = await downloadHandle.createWritable()

      return true
    } catch {
      return false
    }
  }

  async pushBytes(bytes: Uint8Array): Promise<void> {
    if (!this.writableStream) {
      throw Error('Must call selectFileToSaveTo first')
    }
    this.log('Writing chunk to disk of size', bytes.length)
    await this.writableStream.write(bytes)
  }

  async finish(): Promise<void> {
    if (!this.writableStream) {
      throw Error('Must call selectFileToSaveTo first')
    }
    this.log('Closing write stream')
    await this.writableStream.close()
  }
}
