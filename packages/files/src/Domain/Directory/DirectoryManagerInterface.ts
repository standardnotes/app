export interface DirectoryManagerInterface {
  /**
   * The reason we combine presenting a directory picker and transfering old files to the new location
   * in one function is so we don't have to expose a general `transferDirectories` function to the web app,
   * which would give it too much power.
   *
   * @param appendPath The path to append to the selected directory.
   */
  presentDirectoryPickerForLocationChangeAndTransferOld(
    appendPath: string,
    oldLocation?: string,
  ): Promise<string | undefined>

  openLocation(path: string): Promise<void>

  getDirectoryManagerLastErrorMessage(): Promise<string | undefined>
}
