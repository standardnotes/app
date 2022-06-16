/* eslint-disable no-undef */
const { ipcRenderer } = require('electron')
import { MessageToMainProcess } from '../Shared/IpcMessages'

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('use-storage-button').addEventListener('click', () => {
    ipcRenderer.send(MessageToMainProcess.UseLocalstorageForKeychain)
  })

  document.getElementById('quit-button').addEventListener('click', () => {
    ipcRenderer.send(MessageToMainProcess.Quit)
  })

  const learnMoreButton = document.getElementById('learn-more')
  learnMoreButton.addEventListener('click', (event) => {
    ipcRenderer.send(MessageToMainProcess.LearnMoreAboutKeychainAccess)
    event.preventDefault()
    const moreInfo = document.getElementById('more-info')
    moreInfo.style.display = 'block'
    learnMoreButton.style.display = 'none'
  })
})
