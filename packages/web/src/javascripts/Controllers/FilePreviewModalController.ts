import { FileItem } from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'

export class FilePreviewModalController {
  isOpen = false
  currentFile: FileItem | undefined = undefined
  otherFiles: FileItem[] = []

  constructor() {
    makeObservable(this, {
      isOpen: observable,
      currentFile: observable,
      otherFiles: observable,

      activate: action,
      dismiss: action,
      setCurrentFile: action,
    })
  }

  setCurrentFile = (currentFile: FileItem) => {
    this.currentFile = currentFile
  }

  activate = (currentFile: FileItem, otherFiles?: FileItem[]) => {
    this.currentFile = currentFile
    if (otherFiles) {
      this.otherFiles = otherFiles
    }
    this.isOpen = true
  }

  dismiss = () => {
    this.isOpen = false
  }
}
