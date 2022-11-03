export type EditorKitMode = 'plaintext' | 'html' | 'markdown' | 'json'

export type EditorKitOptions = {
  mode: EditorKitMode
  /**
   * For Component Relay saving. Indicates if debouncer is enabled.
   */
  coallesedSaving?: false
  /**
   * For Component Relay saving. Indicates what the debouncer ms delay should be set to.
   */
  coallesedSavingDelay?: 250
}
