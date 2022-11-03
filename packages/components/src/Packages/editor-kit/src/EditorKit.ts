import ComponentRelay from '@standardnotes/component-relay'
import { truncateString, htmlToText } from './Utils'
import { OutgoingItemMessagePayload, NoteContent, DecryptedTransferPayload } from '@standardnotes/snjs'
import { EditorKitDelegate } from './EditorKitDelegate'
import { EditorKitOptions } from './EditorKitOptions'

type NoteMessagePayload = DecryptedTransferPayload<NoteContent> & OutgoingItemMessagePayload<NoteContent>

export default class EditorKit {
  private componentRelay?: ComponentRelay
  private note?: NoteMessagePayload
  private ignoreNextTextChange?: boolean

  constructor(private delegate: EditorKitDelegate, private options: EditorKitOptions) {
    this.connectToBridge()
  }

  private connectToBridge() {
    const { coallesedSaving, coallesedSavingDelay, mode } = this.options

    this.componentRelay = new ComponentRelay({
      targetWindow: window,
      options: {
        coallesedSaving,
        /**
         * The editor does some debouncing for us, so we'll lower the
         * default debounce value from 250 to 150
         */
        coallesedSavingDelay,
      },
      onReady: () => {
        const { platform } = this.componentRelay!

        if (platform) {
          document.documentElement.classList.add(platform)
        }
      },
      onThemesChange: this.delegate.onThemesChange,
      handleRequestForContentHeight: () => {
        return this.delegate.handleRequestForContentHeight()
      },
    })

    this.componentRelay.streamContextItem(async (note: NoteMessagePayload) => {
      /**
       * TODO: If note has changed, release previous temp object URLs.
       */
      let isNewNoteLoad = true
      if (this.note && this.note.uuid == note.uuid) {
        isNewNoteLoad = false
      }

      const previousNote = this.note

      this.note = note

      // Only update UI on non-metadata updates.
      if (note.isMetadataUpdate) {
        return
      }

      let text = note.content?.text || ''

      /**
       * If we're an HTML editor, and we're dealing with a new note,
       * check to see if it's in html format.
       * If it's not, we don't want to convert it to HTML until the user makes an explicit change
       * so we'll ignore the next change event in this case.
       */
      if (mode === 'html' && isNewNoteLoad) {
        const isHtml = /<[a-z][\s\S]*>/i.test(text)
        if (!isHtml) {
          this.ignoreNextTextChange = true
        }
      }

      this.delegate.onNoteValueChange && (await this.delegate.onNoteValueChange(note))
      this.delegate.setEditorRawText(text)

      if (this.delegate.onNoteLockToggle) {
        const previousLockState = this.componentRelay!.getItemAppDataValue(previousNote, 'locked') ?? false
        const newLockState = this.componentRelay!.getItemAppDataValue(this.note, 'locked') ?? false

        if (previousLockState !== newLockState) {
          this.delegate.onNoteLockToggle(newLockState)
        }
      }

      if (isNewNoteLoad) {
        this.delegate.clearUndoHistory?.()
      }
    })
  }

  private configureFileSafe() {
    const requiredDelegateFunctions = [
      'getCurrentLineText',
      'getPreviousLineText',
      'replaceText',
      'getElementsBySelector',
      'insertElement',
      'preprocessElement',
      'insertRawText',
    ]

    for (const functionName of requiredDelegateFunctions) {
      if (!this.delegate[functionName]) {
        throw Error(`Missing ${functionName} delegate function.`)
      }
    }
  }

  /**
   * Called by consumer when the editor has a change/input event.
   */
  public onEditorValueChanged(text: string): void {
    const { mode } = this.options

    if (this.ignoreNextTextChange) {
      this.ignoreNextTextChange = false
      return
    }

    if (!this.note) {
      return
    }

    const note = this.note

    this.componentRelay!.saveItemWithPresave<NoteContent>(note, () => {
      note.content!.text = text

      if (this.delegate.generateCustomPreview) {
        const result = this.delegate.generateCustomPreview(text)

        note.content.preview_plain = result.plain ?? ' '
        note.content.preview_html = result.html
      } else {
        if (mode === 'html') {
          let preview = text
          preview = truncateString(htmlToText(preview))
          /**
           * If the preview has no length due to either being an empty note, or having just 1 FileSafe file
           * that is stripped above, then we don't want to set to empty string, otherwise SN app will default to content
           * for preview. We'll set a whitespace preview instead so SN doesn't go based on innate content.
           */
          note.content.preview_plain = preview.length > 0 ? preview : ' '
        } else {
          note.content.preview_plain = text
        }

        // We're only using plain in this block.
        note.content.preview_html = undefined
      }
    })
  }

  /**
   * saveItemWithPresave from the component relay.
   */
  public saveItemWithPresave(note: NoteMessagePayload, presave?: () => void): void {
    this.componentRelay!.saveItemWithPresave(note, presave)
  }

  /**
   * Gets the current platform where the component is running.
   */
  public get platform(): string | undefined {
    return this.componentRelay!.platform
  }

  /**
   * Gets the current environment where the component is running.
   */
  public get environment(): string | undefined {
    return this.componentRelay!.environment
  }

  public getComponentDataValueForKey(key: string): any {
    return this.componentRelay!.getComponentDataValueForKey(key)
  }

  public setComponentDataValueForKey(key: string, value: any): void {
    this.componentRelay!.setComponentDataValueForKey(key, value)
  }

  public isRunningInMobileApplication(): boolean {
    return this.componentRelay!.isRunningInMobileApplication()
  }
}
