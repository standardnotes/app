import { SNFile } from '@standardnotes/snjs/dist/@types'
import { action, makeObservable, observable } from 'mobx'

export class FilePreviewModalState {
  isOpen = false
  currentFile: SNFile | undefined = undefined
  otherFiles: SNFile[] = []

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

  setCurrentFile = (currentFile: SNFile) => {
    this.currentFile = currentFile
  }

  activate = (currentFile: SNFile, otherFiles: SNFile[]) => {
    this.currentFile = currentFile
    this.otherFiles = otherFiles
    this.isOpen = true
  }

  dismiss = () => {
    this.isOpen = false
  }
}
