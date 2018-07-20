class NoteHistoryEntry extends SFItemHistoryEntry {

  setPreviousEntry(previousEntry) {
    super.setPreviousEntry(previousEntry);
    if(previousEntry) {
      this.textCharDiffLength = this.item.content.text.length - previousEntry.item.content.text.length;
    } else {
      this.textCharDiffLength = this.item.content.text.length;
    }
  }

  previewTitle() {
    return this.item.updated_at.toLocaleString();
  }

  operationVector() {
    if(!this.hasPreviousEntry || this.textCharDiffLength == 0) {
      return 0;
    } else if(this.textCharDiffLength < 0) {
      return -1;
    } else {
      return 1;
    }
  }

  previewSubTitle() {
    if(!this.hasPreviousEntry) {
      return `${this.textCharDiffLength} characters loaded`
    } else if(this.textCharDiffLength < 0) {
      return `${this.textCharDiffLength * -1} characters removed`
    } else if(this.textCharDiffLength > 0) {
      return `${this.textCharDiffLength} characters added`
    } else {
      return "Title changed"
    }
  }
}
