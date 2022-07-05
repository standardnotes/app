import { isEmpty } from '@standardnotes/utils'
import { HistoryEntry } from './HistoryEntry'

export class NoteHistoryEntry extends HistoryEntry {
  previewTitle(): string {
    if (this.payload.updated_at.getTime() > 0) {
      return this.payload.updated_at.toLocaleString()
    } else {
      return this.payload.created_at.toLocaleString()
    }
  }

  previewSubTitle(): string {
    if (!this.hasPreviousEntry) {
      return `${this.textCharDiffLength} characters loaded`
    } else if (this.textCharDiffLength < 0) {
      return `${this.textCharDiffLength * -1} characters removed`
    } else if (this.textCharDiffLength > 0) {
      return `${this.textCharDiffLength} characters added`
    } else {
      return 'Title or metadata changed'
    }
  }

  public override isDiscardable(): boolean {
    return isEmpty(this.payload.content.text)
  }
}
