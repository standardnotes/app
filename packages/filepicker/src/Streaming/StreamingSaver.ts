/**
 * The File System Access API File Picker
 * https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 */
export class StreamingFileSaver {
  public loggingEnabled = false
  private writableStream!: FileSystemWritableFileStream

  constructor(private name: string) {}

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

  /** This function must be called in response to a user interaction, otherwise, it will be rejected by the browser. */
  async selectFileToSaveTo(): Promise<void> {
    this.log('Showing save file picker')

    const downloadHandle = await window.showSaveFilePicker({
      suggestedName: this.name,
    })

    this.writableStream = await downloadHandle.createWritable()
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
